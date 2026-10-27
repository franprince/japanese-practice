// Reader API (ported from Nihongo Rubi's Vercel function): the visitor's country, from Vercel's IP geolocation, to
// pick the translation language. Per visitor, so never cached by the CDN.

export const dynamic = 'force-dynamic'

export function GET(request: Request): Response {
  const country = request.headers.get('x-vercel-ip-country') || null
  return Response.json({ country }, { headers: { 'Cache-Control': 'private, no-store' } })
}
