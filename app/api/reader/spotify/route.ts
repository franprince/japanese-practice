// Reader API: fetches a Spotify link's metadata server-side, and a track's lyrics when asked with `&lyrics=1`.
// Only canonical open.spotify.com links are accepted, so it cannot be used as an open proxy.

import { parseLrc } from '@/features/reader/lib/spotify'

const ALLOWED = /^https:\/\/open\.spotify\.com\/(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]{22})$/
const NEXT_DATA = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
// Each upstream call gets its own budget, so one slow provider cannot hold the whole request.
const TIMEOUT_MS = 5000
const CACHED = 'public, s-maxage=86400, stale-while-revalidate=604800'
// A missed lyrics lookup may be a provider hiccup; retry it soon instead of caching the miss for days.
const MISS = 'public, s-maxage=600'

interface TrackMeta {
  title?: string
  artists: string[]
  durationSec?: number
  thumbnail?: string
}

interface EmbedEntity {
  name?: string
  title?: string
  subtitle?: string
  duration?: number
  artists?: { name?: string }[]
  visualIdentity?: { image?: { url?: string }[] }
}

interface LrcLibItem {
  trackName?: string
  artistName?: string
  plainLyrics?: string
  syncedLyrics?: string
}

interface NetEaseSong {
  id?: number
  name?: string
  artists?: { name?: string }[]
}

const get = (url: string, init?: RequestInit) => fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) })

const norm = (s?: string) => (s ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()

/** True when a candidate is the same song: same title and, when we know them, a shared artist. */
function sameSong(meta: TrackMeta & { title: string }, title?: string, artists?: string[]): boolean {
  if (norm(title) !== norm(meta.title)) return false
  if (meta.artists.length === 0) return true
  const theirs = (artists ?? []).map(norm).filter(Boolean)
  return meta.artists.some((mine) => theirs.some((a) => a === norm(mine) || a.split(/\s*[,&、]\s*/).includes(norm(mine))))
}

function parseEmbedHtml(html: string): TrackMeta | undefined {
  const match = NEXT_DATA.exec(html)
  if (!match?.[1]) return undefined
  try {
    const parsed = JSON.parse(match[1]) as {
      props?: { pageProps?: { state?: { data?: { entity?: EmbedEntity } } } }
    }
    const entity = parsed.props?.pageProps?.state?.data?.entity
    if (!entity) return undefined
    const listed = entity.artists?.map((a) => a.name?.trim()).filter((n): n is string => !!n) ?? []
    const subtitle = entity.subtitle?.trim()
    return {
      title: entity.title ?? entity.name,
      artists: listed.length ? listed : subtitle ? [subtitle] : [],
      durationSec: typeof entity.duration === 'number' && entity.duration > 0 ? Math.round(entity.duration / 1000) : undefined,
      thumbnail: entity.visualIdentity?.image?.[0]?.url,
    }
  } catch {
    return undefined
  }
}

// The embed page is not a public API; when Spotify changes it we fall back to the oEmbed title alone.
async function fetchTrackMeta(trackId: string): Promise<TrackMeta | undefined> {
  try {
    const res = await get(`https://open.spotify.com/embed/track/${trackId}`)
    return res.ok ? parseEmbedHtml(await res.text()) : undefined
  } catch {
    return undefined
  }
}

function extractLrcLibText(item?: LrcLibItem): string | undefined {
  if (item?.plainLyrics?.trim()) return item.plainLyrics.replace(/\r\n?/g, '\n').trim()
  if (item?.syncedLyrics?.trim()) return parseLrc(item.syncedLyrics) || undefined
  return undefined
}

async function lrcLibGet(meta: TrackMeta & { title: string }): Promise<string | undefined> {
  if (!meta.artists[0]) return undefined
  const params = new URLSearchParams({ track_name: meta.title, artist_name: meta.artists[0] })
  if (meta.durationSec) params.set('duration', String(meta.durationSec))
  const res = await get(`https://lrclib.net/api/get?${params}`)
  return res.ok ? extractLrcLibText((await res.json()) as LrcLibItem) : undefined
}

async function lrcLibSearch(meta: TrackMeta & { title: string }): Promise<string | undefined> {
  const params = new URLSearchParams({ track_name: meta.title })
  if (meta.artists[0]) params.set('artist_name', meta.artists[0])
  const res = await get(`https://lrclib.net/api/search?${params}`)
  if (!res.ok) return undefined
  const list = (await res.json()) as unknown
  if (!Array.isArray(list)) return undefined
  for (const item of list as LrcLibItem[]) {
    if (!sameSong(meta, item.trackName, item.artistName ? [item.artistName] : [])) continue
    const text = extractLrcLibText(item)
    if (text) return text
  }
  return undefined
}

async function fetchFromLrcLib(meta: TrackMeta & { title: string }): Promise<string | undefined> {
  // Both lookups run at once; the exact match wins when it has lyrics.
  const [exact, search] = await Promise.allSettled([lrcLibGet(meta), lrcLibSearch(meta)])
  return (exact.status === 'fulfilled' ? exact.value : undefined) ?? (search.status === 'fulfilled' ? search.value : undefined)
}

// NetEase's web API is unofficial and may be unreachable from some regions; it is only a fallback.
async function fetchFromNetEase(meta: TrackMeta & { title: string }): Promise<string | undefined> {
  try {
    const searchRes = await get('https://music.163.com/api/search/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://music.163.com' },
      body: new URLSearchParams({ s: [meta.title, ...meta.artists.slice(0, 1)].join(' '), type: '1', limit: '10' }),
    })
    if (!searchRes.ok) return undefined
    const searchData = (await searchRes.json()) as { result?: { songs?: NetEaseSong[] } }
    const picked = searchData.result?.songs?.find((song) => sameSong(meta, song.name, song.artists?.map((a) => a.name ?? '')))
    if (!picked?.id) return undefined
    const lyricRes = await get(`https://music.163.com/api/song/lyric?id=${picked.id}&lv=1`)
    if (!lyricRes.ok) return undefined
    const raw = ((await lyricRes.json()) as { lrc?: { lyric?: string } }).lrc?.lyric
    return typeof raw === 'string' ? parseLrc(raw) || undefined : undefined
  } catch {
    return undefined
  }
}

async function fetchOEmbed(url: string): Promise<Response> {
  try {
    return await get(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
  } catch {
    return new Response(null, { status: 504 })
  }
}

async function lyricsResponse(url: string, kind: string, id: string): Promise<Response> {
  if (kind !== 'track') return Response.json({ error: 'Only songs have lyrics' }, { status: 400 })
  let meta = await fetchTrackMeta(id)
  if (!meta?.title) {
    const res = await fetchOEmbed(url)
    if (!res.ok) return Response.json({ error: `Spotify answered ${res.status}` }, { status: res.status === 404 ? 404 : 502 })
    const { title } = (await res.json()) as { title?: string }
    meta = { ...meta, artists: meta?.artists ?? [], title }
  }
  const title = meta.title
  if (!title) return Response.json({}, { headers: { 'Cache-Control': MISS } })
  const known = { ...meta, title }
  const lyrics = (await fetchFromLrcLib(known)) ?? (await fetchFromNetEase(known))
  return Response.json(lyrics ? { lyrics } : {}, { headers: { 'Cache-Control': lyrics ? CACHED : MISS } })
}

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams
  const url = params.get('url') ?? ''
  const match = ALLOWED.exec(url)
  if (!match) return Response.json({ error: 'Not a Spotify link' }, { status: 400 })
  const [, kind = '', id = ''] = match

  if (params.get('lyrics') === '1') return lyricsResponse(url, kind, id)

  const res = await fetchOEmbed(url)
  if (!res.ok) {
    return Response.json({ error: `Spotify answered ${res.status}` }, { status: res.status === 404 ? 404 : 502 })
  }
  const { title, thumbnail_url } = (await res.json()) as { title: string; thumbnail_url?: string }
  const body: { title: string; thumbnail?: string; artist?: string } = { title, thumbnail: thumbnail_url }

  if (kind === 'track') {
    const meta = await fetchTrackMeta(id)
    if (meta?.title) body.title = meta.title
    if (!body.thumbnail && meta?.thumbnail) body.thumbnail = meta.thumbnail
    if (meta?.artists.length) body.artist = meta.artists.join(', ')
  }

  return Response.json(body, { headers: { 'Cache-Control': CACHED } })
}
