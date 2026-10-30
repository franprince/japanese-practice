// Spotify links → titles and track lyrics, through /api/reader/spotify with a browser oEmbed fallback.

const LINK = /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]{22})(?:[/?#]\S*)?$/i
const URI = /^spotify:(track|album|playlist|episode|show|artist):([A-Za-z0-9]{22})$/i

export interface SpotifyLink {
  kind: string
  url: string
}

export interface SpotifyInfo {
  title: string
  artist?: string
  thumbnail?: string
  lyrics?: string
}

const CREDIT_LINE = /^\s*(?:作[詞词]|作曲|[編编]曲|唄|歌|Lyricist|Composer|Arranger|Vocals?|Produced\s+by)\s*[:：]/i
const TIME_TAG = /\[(\d+):(\d+(?:\.\d+)?)\]/g

/**
 * Strips `[mm:ss.xx]` timestamps and leading credit lines from LRC lyrics.
 * Preserves explicit blank lines, or inserts stanza breaks when timestamps jump by >= 15s.
 */
export function parseLrc(raw: string): string {
  const entries: { time?: number; text: string }[] = []
  for (const rawLine of raw.replace(/\r\n?/g, '\n').split('\n')) {
    const matches = [...rawLine.matchAll(TIME_TAG)]
    if (matches.length === 0) {
      const text = rawLine.trim()
      if (entries.length === 0 && CREDIT_LINE.test(text)) continue
      entries.push({ text })
      continue
    }
    const text = rawLine.replace(TIME_TAG, '').trim()
    const first = matches[0]!
    const time = Number(first[1]) * 60 + Number(first[2])
    if (entries.every((e) => !e.text) && CREDIT_LINE.test(text)) continue
    entries.push({ time, text })
  }

  const hasExplicitBlanks = entries.some(
    (entry, idx) => !entry.text && idx > 0 && idx < entries.length - 1 && entries.slice(0, idx).some((e) => !!e.text),
  )

  const lines: string[] = []
  let prevTime: number | undefined
  for (const entry of entries) {
    if (!entry.text) {
      if (hasExplicitBlanks && lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('')
      }
      continue
    }
    if (
      !hasExplicitBlanks &&
      prevTime !== undefined &&
      entry.time !== undefined &&
      entry.time - prevTime >= 15 &&
      lines.length > 0 &&
      lines[lines.length - 1] !== ''
    ) {
      lines.push('')
    }
    lines.push(entry.text)
    if (entry.time !== undefined) prevTime = entry.time
  }

  while (lines[0] === '') lines.shift()
  while (lines[lines.length - 1] === '') lines.pop()
  return lines.join('\n')
}

/** The canonical link when the text is nothing but a Spotify link or URI. */
export function parseSpotifyLink(text: string): SpotifyLink | undefined {
  const m = LINK.exec(text.trim()) ?? URI.exec(text.trim())
  if (!m) return undefined
  const kind = m[1]!.toLowerCase()
  return { kind, url: `https://open.spotify.com/${kind}/${m[2]}` }
}

async function read(res: Response): Promise<SpotifyInfo> {
  if (res.status === 404) throw new Error('Spotify has nothing at this link')
  if (!res.ok) throw new Error(`Spotify answered ${res.status}`)
  const data = await res.json()
  const title = data.title
  if (typeof title !== 'string' || !title) throw new Error('Spotify sent no title')
  const info: SpotifyInfo = { title, thumbnail: data.thumbnail_url ?? data.thumbnail }
  if (typeof data.artist === 'string' && data.artist) info.artist = data.artist
  if (typeof data.lyrics === 'string' && data.lyrics.trim()) info.lyrics = data.lyrics.trim()
  return info
}

export async function fetchSpotifyInfo(link: SpotifyLink, signal?: AbortSignal): Promise<SpotifyInfo> {
  const q = encodeURIComponent(link.url)
  try {
    const res = await fetch(`/api/reader/spotify?url=${q}`, { signal })
    if (res.headers.get('content-type')?.includes('json')) {
      return await read(res)
    }
  } catch (err) {
    if (signal?.aborted) throw err
  }
  const res = await fetch(`https://open.spotify.com/oembed?url=${q}`, { signal })
  return read(res)
}
