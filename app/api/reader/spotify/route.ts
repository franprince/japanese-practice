// Reader API (ported from Nihongo Rubi's Vercel function): fetches a Spotify link's oEmbed data server-side, for
// browsers where the direct request from the page is blocked. Only
// open.spotify.com links are accepted, so it can't be used as an open proxy.

const ALLOWED = /^https:\/\/open\.spotify\.com\/(track|album|playlist|episode|show|artist)\/[A-Za-z0-9]{22}$/

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url).searchParams.get('url') ?? ''
  if (!ALLOWED.test(url)) return Response.json({ error: 'Not a Spotify link' }, { status: 400 })

  const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
  if (!res.ok) {
    return Response.json({ error: `Spotify answered ${res.status}` }, { status: res.status === 404 ? 404 : 502 })
  }
  const { title, thumbnail_url } = await res.json()
  return Response.json(
    { title, thumbnail: thumbnail_url },
    { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } },
  )
}
