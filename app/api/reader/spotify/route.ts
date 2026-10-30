// Reader API: fetches a Spotify link's metadata and (for tracks) lyrics server-side.
// Only canonical open.spotify.com links are accepted, so it cannot be used as an open proxy.

import { parseLrc } from '@/features/reader/lib/spotify'

const ALLOWED = /^https:\/\/open\.spotify\.com\/(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]{22})$/
const NEXT_DATA = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/

interface TrackMeta {
  title?: string
  artist?: string
  durationSec?: number
  thumbnail?: string
}

interface EmbedArtist {
  name?: string
}

interface EmbedImage {
  url?: string
}

interface EmbedEntity {
  name?: string
  title?: string
  subtitle?: string
  duration?: number
  artists?: EmbedArtist[]
  visualIdentity?: {
    image?: EmbedImage[]
  }
}

interface LrcLibItem {
  trackName?: string
  artistName?: string
  plainLyrics?: string
  syncedLyrics?: string
}

interface NetEaseArtist {
  name?: string
}

interface NetEaseSong {
  id?: number
  name?: string
  artists?: NetEaseArtist[]
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
    const title = entity.title ?? entity.name
    const artistList = entity.artists?.map((a) => a.name?.trim()).filter((n): n is string => !!n)
    const artist = artistList?.length ? artistList.join(', ') : entity.subtitle?.trim()
    const durationSec = typeof entity.duration === 'number' && entity.duration > 0
      ? Math.round(entity.duration / 1000)
      : undefined
    const thumbnail = entity.visualIdentity?.image?.[0]?.url
    return { title, artist, durationSec, thumbnail }
  } catch {
    return undefined
  }
}

async function fetchTrackMeta(trackId: string): Promise<TrackMeta | undefined> {
  try {
    const res = await fetch(`https://open.spotify.com/embed/track/${trackId}`)
    if (!res.ok) return undefined
    const html = await res.text()
    return parseEmbedHtml(html)
  } catch {
    return undefined
  }
}

function extractLrcLibText(item?: LrcLibItem): string | undefined {
  if (!item) return undefined
  if (typeof item.plainLyrics === 'string' && item.plainLyrics.trim()) {
    return item.plainLyrics.replace(/\r\n?/g, '\n').trim()
  }
  if (typeof item.syncedLyrics === 'string' && item.syncedLyrics.trim()) {
    const parsed = parseLrc(item.syncedLyrics)
    if (parsed) return parsed
  }
  return undefined
}

async function fetchFromLrcLib(title: string, artist?: string, durationSec?: number): Promise<string | undefined> {
  try {
    if (artist) {
      const params = new URLSearchParams({ track_name: title, artist_name: artist })
      if (durationSec) params.set('duration', String(durationSec))
      const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`)
      if (res.ok) {
        const data = (await res.json()) as LrcLibItem
        const text = extractLrcLibText(data)
        if (text) return text
      }
    }
    const q = artist ? `${title} ${artist}` : title
    const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`)
    if (!searchRes.ok) return undefined
    const list = (await searchRes.json()) as unknown
    if (!Array.isArray(list)) return undefined
    const normTitle = title.trim().toLowerCase()
    const match = (list as LrcLibItem[]).find((item) => item.trackName?.trim().toLowerCase() === normTitle) ?? (list as LrcLibItem[])[0]
    return extractLrcLibText(match)
  } catch {
    return undefined
  }
}

async function fetchFromNetEase(title: string, artist?: string): Promise<string | undefined> {
  try {
    const s = artist ? `${title} ${artist}` : title
    const searchRes = await fetch('https://music.163.com/api/search/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: 'https://music.163.com',
      },
      body: new URLSearchParams({ s, type: '1', limit: '5' }),
    })
    if (!searchRes.ok) return undefined
    const searchData = (await searchRes.json()) as { result?: { songs?: NetEaseSong[] } }
    const songs = searchData.result?.songs
    if (!Array.isArray(songs) || songs.length === 0) return undefined

    const normTitle = title.trim().toLowerCase()
    const normArtist = artist?.trim().toLowerCase()
    const picked =
      songs.find(
        (song) =>
          song.name?.trim().toLowerCase() === normTitle &&
          (!normArtist || song.artists?.some((a) => a.name?.trim().toLowerCase() === normArtist)),
      ) ??
      songs.find((song) => song.name?.trim().toLowerCase() === normTitle) ??
      songs[0]

    if (!picked?.id) return undefined
    const lyricRes = await fetch(`https://music.163.com/api/song/lyric?id=${picked.id}&lv=1`)
    if (!lyricRes.ok) return undefined
    const lyricData = (await lyricRes.json()) as { lrc?: { lyric?: string } }
    const raw = lyricData.lrc?.lyric
    if (typeof raw !== 'string' || !raw.trim()) return undefined
    const cleaned = parseLrc(raw)
    return cleaned || undefined
  } catch {
    return undefined
  }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url).searchParams.get('url') ?? ''
  const match = ALLOWED.exec(url)
  if (!match) return Response.json({ error: 'Not a Spotify link' }, { status: 400 })

  const [, kind, id] = match
  const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
  if (!res.ok) {
    return Response.json({ error: `Spotify answered ${res.status}` }, { status: res.status === 404 ? 404 : 502 })
  }
  const { title, thumbnail_url } = (await res.json()) as { title: string; thumbnail_url?: string }

  const body: { title: string; thumbnail?: string; artist?: string; lyrics?: string } = {
    title,
    thumbnail: thumbnail_url,
  }

  if (kind === 'track' && id) {
    const meta = await fetchTrackMeta(id)
    const trackTitle = meta?.title || title
    if (meta?.title) body.title = meta.title
    if (!body.thumbnail && meta?.thumbnail) body.thumbnail = meta.thumbnail
    if (meta?.artist) body.artist = meta.artist

    if (trackTitle) {
      const lyrics =
        (await fetchFromLrcLib(trackTitle, meta?.artist, meta?.durationSec)) ??
        (await fetchFromNetEase(trackTitle, meta?.artist))
      if (lyrics) body.lyrics = lyrics
    }
  }

  return Response.json(body, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  })
}
