// Spotify links → titles, through Spotify's public oEmbed endpoint (no API key).

const LINK = /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]{22})(?:[/?#]\S*)?$/i
const URI = /^spotify:(track|album|playlist|episode|show|artist):([A-Za-z0-9]{22})$/i

export type SpotifyLink = { kind: string; url: string }
export type SpotifyInfo = { title: string; thumbnail?: string }

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
  return { title, thumbnail: data.thumbnail_url ?? data.thumbnail }
}

export async function fetchSpotifyInfo(link: SpotifyLink, signal?: AbortSignal): Promise<SpotifyInfo> {
  const q = encodeURIComponent(link.url)
  let res: Response
  try {
    res = await fetch(`https://open.spotify.com/oembed?url=${q}`, { signal })
  } catch (err) {
    if (signal?.aborted) throw err
    // Blocked in the browser (CORS, extensions…): ask our own function (api/spotify.ts on Vercel).
    res = await fetch(`/api/reader/spotify?url=${q}`, { signal })
    // Without the function (GitHub Pages, vite preview) this comes back as an HTML page.
    if (!res.headers.get('content-type')?.includes('json')) {
      throw new Error('Spotify could not be reached from this browser')
    }
  }
  return read(res)
}
