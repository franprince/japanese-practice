// Reader API (ported from Nihongo Rubi's Vercel function): DeepL's current list of target languages, using
// DEEPL_API_KEY. Cached by the CDN for a day.

import { fetchDeepL, unreachable } from '../deepl'

export async function GET(): Promise<Response> {
  const key = process.env.DEEPL_API_KEY
  if (!key) return Response.json({ error: 'DeepL is not configured' }, { status: 501 })

  let res: Response
  try {
    res = await fetchDeepL(key, '/v2/languages?type=target')
  } catch (error) {
    return unreachable(error)
  }
  if (!res.ok) return Response.json({ error: `DeepL answered ${res.status}` }, { status: 502 })

  const list: unknown = await res.json().catch(() => undefined)
  if (!Array.isArray(list)) return Response.json({ error: 'DeepL sent no languages' }, { status: 502 })
  return Response.json(
    { languages: (list as { language: string; name: string }[]).map((l) => ({ code: l.language.toUpperCase(), name: l.name })) },
    { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } },
  )
}
