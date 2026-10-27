// Japanese → the chosen language (DeepL codes, see languages.ts). DeepL first, through our Vercel function
// (api/translate.ts, which holds the key); when that is missing or fails, the
// free MyMemory API, called from the browser. Long text is sent in
// sentence-sized chunks and results are cached.

import { ENGLISH, myMemoryCode } from './languages'
import { alignTranslation } from './translationAlignment'
import type { TranslationGroup } from './translationTypes'

export type Provider = 'DeepL' | 'MyMemory'
export type Translated = { text: string; provider: Provider; lines?: string[]; groups?: TranslationGroup[] }
type Passage = Omit<Translated, 'provider'>

const MYMEMORY = 'https://api.mymemory.translated.net/get'
// MyMemory takes 500 bytes per request; the DeepL function takes 1,000 characters.
const LIMITS: Record<Provider, number> = { MyMemory: 500, DeepL: 2400 }
const bytes = (s: string) => new TextEncoder().encode(s).length

/** Prefer complete lyric lines, then sentence ends, commas and finally anywhere under `maxBytes`. */
export function chunk(text: string, maxBytes = LIMITS.MyMemory, maxChars = Infinity): string[] {
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

const decode = (s: string) => new DOMParser().parseFromString(s, 'text/html').documentElement.textContent ?? s

/** Thrown when the DeepL function can't be used at all, so MyMemory should take over. */
class Unavailable extends Error {}

async function viaDeepL(q: string, to: string, signal?: AbortSignal, paired = false): Promise<Passage> {
  // Older paired responses contain XML-induced word/line shifts or groups merged by lyric punctuation.
  const query = new URLSearchParams({ text: q, to, v: paired ? '5' : '2' })
  if (paired) query.set('format', 'lines')
  const res = await fetch(`/api/reader/translate?${query}`, { signal })
  // No function here (GitHub Pages, vite dev) comes back as an HTML page.
  if (!res.headers.get('content-type')?.includes('json')) throw new Unavailable('no translation function')
  const data = await res.json()
  if (!res.ok || typeof data?.text !== 'string') throw new Unavailable(data?.error ?? `answered ${res.status}`)
  const groups = data.groups
  if (groups !== undefined && (!Array.isArray(groups) || !groups.length || groups.some((group, i) =>
    !Number.isInteger(group.start) || !Number.isInteger(group.end) || group.start < 0 ||
    group.end < group.start || typeof group.text !== 'string' ||
    group.start !== (i ? groups[i - 1].end + 1 : 0)) || groups.at(-1).end !== q.split('\n').length - 1)) {
    throw new Unavailable('invalid lyric groups')
  }
  if (groups && groups.map((group: TranslationGroup) => group.text).join('').replace(/\s/gu, '') !==
    data.text.replace(/\s/gu, '')) {
    throw new Unavailable('incomplete lyric groups')
  }
  return { text: data.text, ...(groups ? { groups } : {}) }
}

type Match = { translation?: string; 'created-by'?: string; reference?: string }
const isMachine = (m: Match) => /^MT/i.test(m['created-by'] ?? '') || /machine translation/i.test(m.reference ?? '')

async function viaMyMemory(q: string, to: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(`${MYMEMORY}?${new URLSearchParams({ q, langpair: `ja|${myMemoryCode(to)}` })}`, { signal }).catch((err) => {
    throw signal?.aborted ? err : new Error('MyMemory could not be reached')
  })
  if (!res.ok) throw new Error(res.status === 429 ? 'the free daily limit has been used up' : `MyMemory answered ${res.status}`)
  const data = await res.json()
  const text: string = data?.responseData?.translatedText ?? ''
  const status = Number(data?.responseStatus)
  if (data?.quotaFinished || status === 429 || /^MYMEMORY WARNING/i.test(text)) {
    throw new Error('the free daily limit has been used up; it resets within a day')
  }
  if (status !== 200 || !text) throw new Error(data?.responseDetails || `MyMemory answered ${status || 'without a translation'}`)
  // The top result can be a pair someone uploaded to MyMemory's translation
  // memory (花鬘 → "Sekai no Owari", the band's name). Prefer the machine
  // translation listed among the matches.
  const machine = (Array.isArray(data.matches) ? (data.matches as Match[]) : []).find(isMachine)?.translation
  return decode(machine || text)
}

const SERVICES: Record<Provider, (q: string, to: string, signal?: AbortSignal) => Promise<Passage>> = {
  DeepL: viaDeepL,
  MyMemory: async (q, to, signal) => ({ text: await viaMyMemory(q, to, signal) }),
}

const cache = new Map<string, Translated>()
let deeplDown = false

async function translateWith(provider: Provider, text: string, to: string, signal?: AbortSignal): Promise<Passage> {
  const out: string[] = []
  for (const piece of chunk(text, LIMITS[provider], provider === 'DeepL' ? 1000 : Infinity)) {
    signal?.throwIfAborted()
    out.push((await SERVICES[provider](piece, to, signal)).text)
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
      if (bytes(next) > LIMITS.DeepL || [...next].length > 1000) break
      end++
    }
    const passage = source.slice(start, end).join('\n')
    signal?.throwIfAborted()
    // An oversized source line still owns one row, even when it needs several requests.
    const result = bytes(passage) > LIMITS.DeepL || [...passage].length > 1000
      ? await translateWith('DeepL', passage, to, signal)
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
  let result: Translated | undefined
  if (!deeplDown) {
    try {
      const passage = paired ? await pairedDeepL(text, to, signal) : await translateWith('DeepL', text, to, signal)
      result = { ...passage, provider: 'DeepL' }
    } catch (err) {
      if (signal?.aborted) throw err
      // Without the function, don't ask again on every edit.
      if (err instanceof Unavailable && err.message === 'no translation function') deeplDown = true
      console.warn('DeepL translation unavailable, using MyMemory:', (err as Error).message)
    }
  }
  result ??= { ...await translateWith('MyMemory', text, to, signal), provider: 'MyMemory' }
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
