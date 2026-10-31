// Reader API: fetches a Spotify link's metadata server-side, and a track's lyrics when asked with `&lyrics=1`.
// Only canonical open.spotify.com links are accepted, so it cannot be used as an open proxy.

import { japaneseGlyphs } from '@/features/reader/lib/japanese'
import { parseLrc } from '@/features/reader/lib/spotify'
import { SITE_URL } from '@/lib/seo'

const ALLOWED = /^https:\/\/open\.spotify\.com\/(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]{22})$/
const NEXT_DATA = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
// Each upstream call gets its own budget, so one slow provider cannot hold the whole request.
const TIMEOUT_MS = 5000
const CACHED = 'public, s-maxage=86400, stale-while-revalidate=604800'
// A missed lyrics lookup may be a provider hiccup; retry it soon instead of caching the miss for days.
const MISS = 'public, s-maxage=600'
// LRCLIB asks clients to name themselves, as registered there (nihongo-renshuu). A registered app raises our rate limit: the secret server key
// (LRCLIB_API_KEY) when it is set, else the app ID, which is public by design.
const LRCLIB_APP_ID = '3g92CwLUzSih4IfD2oSha_bj3FOfschwREUDIe3pSLM'
const lrclibHeaders = (): Record<string, string> => {
  const key = process.env.LRCLIB_API_KEY
  return {
    'User-Agent': `nihongo-renshuu (${SITE_URL}/reader)`,
    ...(key ? { 'Lrclib-Api-Key': key } : { 'Lrclib-App-Id': LRCLIB_APP_ID }),
  }
}

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

/** What we know of a song to look up its lyrics: its names, Japanese ones first, and its length. */
interface Song {
  names: { title: string; artist?: string }[]
  durationSec?: number
}

const get = (url: string, init?: RequestInit) => fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) })

const norm = (s?: string) => (s ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()

/**
 * True when a candidate is the same song: one of its titles and, when we know them, a shared artist.
 * Either spelling counts, so 家入レオ on NetEase matches Spotify's Leo Ieiri.
 */
function sameSong(song: Song, title?: string, artists?: string[]): boolean {
  if (!song.names.some((n) => norm(n.title) === norm(title))) return false
  const mine = song.names.map((n) => norm(n.artist)).filter(Boolean)
  if (mine.length === 0) return true
  const theirs = (artists ?? []).map(norm).filter(Boolean)
  return mine.some((m) => theirs.some((a) => a === m || a.split(/\s*[,&、]\s*/).includes(m)))
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
// With locale=ja it names Japanese artists and songs as written in Japanese (家入レオ, not Leo Ieiri).
async function fetchTrackMeta(trackId: string, locale?: 'ja'): Promise<TrackMeta | undefined> {
  try {
    const res = await get(`https://open.spotify.com/embed/track/${trackId}${locale ? `?locale=${locale}` : ''}`)
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

async function lrcLibGet(song: Song, { title, artist }: Song['names'][number]): Promise<string | undefined> {
  if (!artist) return undefined
  const params = new URLSearchParams({ track_name: title, artist_name: artist })
  if (song.durationSec) params.set('duration', String(song.durationSec))
  const res = await get(`https://lrclib.net/api/get?${params}`, { headers: lrclibHeaders() })
  return res.ok ? extractLrcLibText((await res.json()) as LrcLibItem) : undefined
}

async function lrcLibSearch(song: Song, { title, artist }: Song['names'][number]): Promise<string | undefined> {
  const params = new URLSearchParams({ track_name: title })
  if (artist) params.set('artist_name', artist)
  const res = await get(`https://lrclib.net/api/search?${params}`, { headers: lrclibHeaders() })
  if (!res.ok) return undefined
  const list = (await res.json()) as unknown
  if (!Array.isArray(list)) return undefined
  for (const item of list as LrcLibItem[]) {
    if (!sameSong(song, item.trackName, item.artistName ? [item.artistName] : [])) continue
    const text = extractLrcLibText(item)
    if (text) return text
  }
  return undefined
}

async function fetchFromLrcLib(song: Song): Promise<string | undefined> {
  // Every lookup for every spelling runs at once; earlier names and exact matches win.
  const lookups = song.names.flatMap((name) => [lrcLibGet(song, name), lrcLibSearch(song, name)])
  const results = await Promise.allSettled(lookups)
  return results.map((r) => (r.status === 'fulfilled' ? r.value : undefined)).find(Boolean)
}

// NetEase's web API is unofficial and may be unreachable from some regions; it is only a fallback.
async function fetchFromNetEase(song: Song): Promise<string | undefined> {
  const { title, artist } = song.names[0]!
  try {
    const searchRes = await get('https://music.163.com/api/search/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://music.163.com' },
      body: new URLSearchParams({ s: [title, artist].filter(Boolean).join(' '), type: '1', limit: '10' }),
    })
    if (!searchRes.ok) return undefined
    const searchData = (await searchRes.json()) as { result?: { songs?: NetEaseSong[] } }
    const matches = (searchData.result?.songs ?? []).filter((s) => s.id && sameSong(song, s.name, s.artists?.map((a) => a.name ?? '')))
    // The same song is often listed more than once (single, album) and only some copies have lyrics.
    for (const match of matches.slice(0, 3)) {
      // lv=-1 asks for the latest lyrics version; lv=1 comes back empty for songs that have newer ones.
      const lyricRes = await get(`https://music.163.com/api/song/lyric?id=${match.id}&lv=-1&kv=-1&tv=-1`)
      if (!lyricRes.ok) continue
      const raw = ((await lyricRes.json()) as { lrc?: { lyric?: string } }).lrc?.lyric
      const text = typeof raw === 'string' ? parseLrc(raw) : ''
      if (text) return text
    }
    return undefined
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
  const metas = (await Promise.all([fetchTrackMeta(id, 'ja'), fetchTrackMeta(id)])).filter((m) => m?.title)
  const names = metas.map((m) => ({ title: m!.title!, artist: m!.artists[0] }))
  if (names.length === 0) {
    const res = await fetchOEmbed(url)
    if (!res.ok) return Response.json({ error: `Spotify answered ${res.status}` }, { status: res.status === 404 ? 404 : 502 })
    const { title } = (await res.json()) as { title?: string }
    if (!title) return Response.json({}, { headers: { 'Cache-Control': MISS } })
    names.push({ title, artist: undefined })
  }
  const song: Song = {
    names: names.filter((n, i) => names.findIndex((o) => o.title === n.title && o.artist === n.artist) === i),
    durationSec: metas[0]?.durationSec,
  }
  const found = (await fetchFromLrcLib(song)) ?? (await fetchFromNetEase(song))
  const lyrics = found && japaneseGlyphs(found)
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
    const meta = await fetchTrackMeta(id, 'ja')
    if (meta?.title) body.title = meta.title
    if (!body.thumbnail && meta?.thumbnail) body.thumbnail = meta.thumbnail
    if (meta?.artists.length) body.artist = meta.artists.join(', ')
  }

  return Response.json(body, { headers: { 'Cache-Control': CACHED } })
}
