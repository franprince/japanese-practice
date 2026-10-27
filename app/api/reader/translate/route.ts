// Reader API (ported from Nihongo Rubi's Vercel function): Japanese → another language (?to=ES, default EN-US) with DeepL, using the DEEPL_API_KEY
// environment variable so the key never reaches the browser. It only takes
// short Japanese text, and identical requests are served from Vercel's cache,
// to keep strangers from spending the monthly quota.

import { alignTranslation } from '@/features/reader/lib/translationAlignment'

const MAX_CHARS = 1000
const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u
// DeepL target codes: ES, PT-BR, ZH-HANS, ES-419…
const TARGET = /^(?!JA)[A-Z]{2}(-[A-Z0-9]{2,4})?$/

export async function GET(request: Request): Promise<Response> {
  const key = process.env.DEEPL_API_KEY
  if (!key) return Response.json({ error: 'DeepL is not configured' }, { status: 501 })

  const params = new URL(request.url).searchParams
  const paired = params.get('format') === 'lines'
  const raw = params.get('text') ?? ''
  const text = paired ? raw : raw.trim()
  const to = params.get('to')?.toUpperCase() || 'EN-US'
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  if (!text.trim() || [...text].length > MAX_CHARS || !JAPANESE.test(text)) {
    return Response.json({ error: `Send up to ${MAX_CHARS} characters of Japanese text` }, { status: 400 })
  }
  if (!TARGET.test(to)) return Response.json({ error: `Unknown target language ${to}` }, { status: 400 })

  // Free-plan keys end in ":fx" and use their own host.
  const host = key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com'
  const res = await fetch(`${host}/v2/translate`, {
    method: 'POST',
    headers: { Authorization: `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: [text],
      source_lang: 'JA',
      target_lang: to,
      // Lyric line breaks can divide one sentence; preserve them without isolating each phrase.
      split_sentences: 'nonewlines',
      preserve_formatting: true,
    }),
  })
  if (!res.ok) {
    const error =
      res.status === 456 ? 'the DeepL monthly quota is used up'
      : res.status === 429 ? 'too many requests to DeepL'
      : res.status === 403 ? 'DeepL rejected the API key'
      : res.status === 400 ? `DeepL can't translate into ${to}`
      : `DeepL answered ${res.status}`
    return Response.json({ error }, { status: res.status === 429 ? 429 : 502 })
  }

  const data = await res.json()
  const translated = data?.translations?.[0]?.text
  if (typeof translated !== 'string' || !translated.trim()) {
    return Response.json({ error: 'DeepL sent no translation' }, { status: 502 })
  }
  const result = paired ? alignTranslation(lines, translated) : { text: translated }
  return Response.json(
    result,
    { headers: { 'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=604800' } },
  )
}
