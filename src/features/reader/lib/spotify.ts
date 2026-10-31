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
}

const CREDIT_LINE = /^\s*(?:作[詞词]|作曲|[編编]曲|唄|歌|Lyricist|Composer|Arranger|Vocals?|Produced\s+by)\s*[:：]/i
const TIME_TAG = /\[(\d+):(\d+(?:\.\d+)?)\]/g
// `[ar:Artist]`, `[offset:+200]`… header tags, and the JSON credit rows NetEase sometimes puts first.
const ID_TAG = /^\[[a-z#]+:[^\]]*\]$|^\{.*\}$/i
// Word-level timings of enhanced LRC: `<00:12.34>`.
const WORD_TAG = /<\d+:\d+(?:\.\d+)?>/g

/**
 * Turns LRC lyrics into plain text: drops timestamps, header tags and leading credit lines,
 * and orders lines by time so a line stamped for several moments (a repeated chorus) appears each time.
 * Keeps explicit blank lines, or inserts stanza breaks when the timestamps jump by >= 15s.
 */
export function parseLrc(raw: string): string {
  const entries: { time: number; text: string; timed: boolean }[] = []
  let lastTime = 0
  let seenText = false
  for (const rawLine of raw.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trim()
    if (ID_TAG.test(line)) continue
    const times = [...line.matchAll(TIME_TAG)].map((m) => Number(m[1]) * 60 + Number(m[2]))
    const text = line.replace(TIME_TAG, '').replace(WORD_TAG, '').trim()
    if (!seenText && CREDIT_LINE.test(text)) continue
    if (text) seenText = true
    // An untimed line stays right after the line before it.
    if (times.length === 0) entries.push({ time: lastTime, text, timed: false })
    for (const time of times) entries.push({ time, text, timed: true })
    if (times[0] !== undefined) lastTime = times[0]
  }
  entries.sort((a, b) => a.time - b.time)

  const first = entries.findIndex((e) => e.text)
  const last = entries.findLastIndex((e) => e.text)
  const hasExplicitBlanks = entries.some((e, i) => !e.text && i > first && i < last)

  const lines: string[] = []
  let prevTime: number | undefined
  for (const entry of entries) {
    if (!entry.text) {
      if (hasExplicitBlanks && lines.length > 0 && lines[lines.length - 1] !== '') lines.push('')
      continue
    }
    if (!hasExplicitBlanks && prevTime !== undefined && entry.timed && entry.time - prevTime >= 15 && lines[lines.length - 1] !== '') {
      lines.push('')
    }
    lines.push(entry.text)
    if (entry.timed) prevTime = entry.time
  }

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
  const data = await res.json().catch(() => ({}))
  if (res.status === 404) throw new Error('Spotify has nothing at this link')
  if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : `Spotify answered ${res.status}`)
  const title = data.title
  if (typeof title !== 'string' || !title) throw new Error('Spotify sent no title')
  const info: SpotifyInfo = { title, thumbnail: data.thumbnail_url ?? data.thumbnail }
  if (typeof data.artist === 'string' && data.artist) info.artist = data.artist
  return info
}

const isJson = (res?: Response) => !!res?.headers.get('content-type')?.includes('json')

export async function fetchSpotifyInfo(link: SpotifyLink, signal?: AbortSignal): Promise<SpotifyInfo> {
  const q = encodeURIComponent(link.url)
  let res: Response | undefined
  try {
    res = await fetch(`/api/reader/spotify?url=${q}`, { signal })
  } catch (err) {
    if (signal?.aborted) throw err
  }
  if (isJson(res)) return read(res!)
  // Without our function (GitHub Pages, vite preview) the route is missing or unreachable: ask Spotify directly.
  return read(await fetch(`https://open.spotify.com/oembed?url=${q}`, { signal }))
}

/** A song's lyrics as plain text, or undefined when no source has them. Only our function can look them up. */
export async function fetchSpotifyLyrics(link: SpotifyLink, signal?: AbortSignal): Promise<string | undefined> {
  const res = await fetch(`/api/reader/spotify?url=${encodeURIComponent(link.url)}&lyrics=1`, { signal })
  if (!isJson(res)) throw new Error('Lyrics are not available on this site')
  const data = await res.json()
  if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : `Lyrics lookup failed (${res.status})`)
  return typeof data.lyrics === 'string' && data.lyrics.trim() ? data.lyrics.trim() : undefined
}
