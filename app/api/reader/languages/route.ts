// Reader API (ported from Nihongo Rubi's Vercel function): DeepL's current list of target languages, using
// DEEPL_API_KEY. Cached by the CDN for a day.

export async function GET(): Promise<Response> {
  const key = process.env.DEEPL_API_KEY
  if (!key) return Response.json({ error: 'DeepL is not configured' }, { status: 501 })

  const host = key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com'
  const res = await fetch(`${host}/v2/languages?type=target`, { headers: { Authorization: `DeepL-Auth-Key ${key}` } })
  if (!res.ok) return Response.json({ error: `DeepL answered ${res.status}` }, { status: 502 })

  const list: { language: string; name: string }[] = await res.json()
  return Response.json(
    { languages: list.map((l) => ({ code: l.language.toUpperCase(), name: l.name })) },
    { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } },
  )
}
