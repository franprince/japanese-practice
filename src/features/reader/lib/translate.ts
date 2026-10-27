// Japanese → the chosen language (DeepL codes, see languages.ts), through our Vercel function
// (app/api/reader/translate, which holds the DeepL key). Long text is sent in
// sentence-sized chunks and results are cached.

import { ENGLISH } from './languages'
import { alignTranslation } from './translationAlignment'
import type { TranslationGroup } from './translationTypes'

export type Provider = 'DeepL'
export type Translated = { text: string; provider: Provider; lines?: string[]; groups?: TranslationGroup[] }
type Passage = Omit<Translated, 'provider'>

// The DeepL function takes 1,000 characters (at most 2,400 bytes) per request.
const MAX_BYTES = 2400
const MAX_CHARS = 1000
const bytes = (s: string) => new TextEncoder().encode(s).length

/** Prefer complete lyric lines, then sentence ends, commas and finally anywhere under `maxBytes`. */
export function chunk(text: string, maxBytes = 500, maxChars = Infinity): string[] {
  const out: string[] = []
  const push = (piece: string, separators: RegExp[]) => {
    if (!piece.trim()) return
    if (bytes(piece) <= maxBytes && [...piece].length <= maxChars) return void out.push(piece.trim())
    const [sep, ...rest] = separators
    const parts = sep ? piece.split(sep) : [...piece]
    let current = ''
    for (const p of parts) {
      if ((bytes(current + p) > maxBytes || [...current + p].length > maxChars) && current) {
        push(current, rest)
        current = ''
      }
      current += p
    }
    push(current, rest)
  }
  push(text, [/(?<=\n)/, /(?<=[。！？!?])/, /(?<=[、，,])/, /(?<=\s)/])
  return out
}

async function viaDeepL(q: string, to: string, signal?: AbortSignal, paired = false): Promise<Passage> {
  // Older paired responses contain XML-induced word/line shifts or groups merged by lyric punctuation.
  const query = new URLSearchParams({ text: q, to, v: paired ? '5' : '2' })
  if (paired) query.set('format', 'lines')
  const res = await fetch(`/api/reader/translate?${query}`, { signal })
  // No function here (GitHub Pages, vite dev) comes back as an HTML page.
  if (!res.headers.get('content-type')?.includes('json')) throw new Error("the translation service isn't available")
  const data = await res.json()
  if (!res.ok || typeof data?.text !== 'string') throw new Error(data?.error ?? `answered ${res.status}`)
  const groups = data.groups
  if (groups !== undefined && (!Array.isArray(groups) || !groups.length || groups.some((group, i) =>
    !Number.isInteger(group.start) || !Number.isInteger(group.end) || group.start < 0 ||
    group.end < group.start || typeof group.text !== 'string' ||
    group.start !== (i ? groups[i - 1].end + 1 : 0)) || groups.at(-1).end !== q.split('\n').length - 1)) {
    throw new Error('invalid lyric groups')
  }
  if (groups && groups.map((group: TranslationGroup) => group.text).join('').replace(/\s/gu, '') !==
    data.text.replace(/\s/gu, '')) {
    throw new Error('incomplete lyric groups')
  }
  return { text: data.text, ...(groups ? { groups } : {}) }
}

const cache = new Map<string, Translated>()

async function translateChunks(text: string, to: string, signal?: AbortSignal): Promise<Passage> {
  const out: string[] = []
  for (const piece of chunk(text, MAX_BYTES, MAX_CHARS)) {
    signal?.throwIfAborted()
    out.push((await viaDeepL(piece, to, signal)).text)
  }
  return { text: out.join(text.includes('\n') ? '\n' : ' ') }
}

async function pairedDeepL(text: string, to: string, signal?: AbortSignal): Promise<Passage> {
  const source = text.split('\n')
  const groups: TranslationGroup[] = []
  const output: string[] = []
  for (let start = 0; start < source.length;) {
    let end = start + 1
    while (end < source.length) {
      const next = source.slice(start, end + 1).join('\n')
      if (bytes(next) > MAX_BYTES || [...next].length > MAX_CHARS) break
      end++
    }
    const passage = source.slice(start, end).join('\n')
    signal?.throwIfAborted()
    // An oversized source line still owns one row, even when it needs several requests.
    const result = bytes(passage) > MAX_BYTES || [...passage].length > MAX_CHARS
      ? await translateChunks(passage, to, signal)
      : passage.trim() ? await viaDeepL(passage, to, signal, true) : { text: '' }
    output.push(result.text)
    const matched = result.groups ?? alignTranslation(source.slice(start, end), result.text).groups
    groups.push(...matched.map((group) => ({
      ...group, start: group.start + start, end: group.end + start,
    })))
    start = end
  }
  return { text: output.join('\n'), groups }
}

async function passageTranslation(text: string, to: string, signal?: AbortSignal, paired = false): Promise<Translated> {
  signal?.throwIfAborted()
  const key = `${paired ? 'lines' : 'text'}\n${to}\n${text}`
  const cached = cache.get(key)
  if (cached) return cached
  const passage = paired ? await pairedDeepL(text, to, signal) : await translateChunks(text, to, signal)
  const result: Translated = { ...passage, provider: 'DeepL' }
  signal?.throwIfAborted()
  cache.set(key, result)
  return result
}

export async function translate(text: string, to = ENGLISH, signal?: AbortSignal): Promise<Translated> {
  return passageTranslation(text, to, signal)
}

/** Align the completed passage without changing translation context or copied text. */
export async function translateLines(
  lines: string[],
  to: string,
  signal?: AbortSignal,
): Promise<Translated> {
  const result = await passageTranslation(lines.join('\n'), to, signal, true)
  const groups = result.groups ?? alignTranslation(lines, result.text).groups
  const aligned = groups.length === lines.length && groups.every((group, i) => group.start === i && group.end === i)
  return { ...result, groups, ...(aligned ? { lines: groups.map((group) => group.text) } : {}) }
}
