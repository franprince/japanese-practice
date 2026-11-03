// Builds the conversion lexicon from data the reader already loads: kuromoji's IPADIC dictionary
// (every word with its reading and costs) and JMdict's common words (to favour learner vocabulary).
import type { IpadicFeatures, Tokenizer } from 'kuromoji'
import type { Entry, Lexicon } from './convert'
import type { RawWord } from './dictionary'
import { baseReading, kataToHira } from './japanese'

// kuromoji's dictionary internals, which its types do not describe.
type Buffer = { buffer: Uint8Array; getShort(i: number): number; getInt(i: number): number }
type Internals = {
  token_info_dictionary: { dictionary: Buffer; pos_buffer: Buffer }
  viterbi_searcher: { connection_costs: { get(right: number, left: number): number } }
}

// Each token info record is left id, right id and cost (2 bytes each), then its feature offset (4).
const RECORD = 10
// IPADIC features after the surface: pos, 3 subclasses, conjugation type and form, base, reading.
const POS = 1, SUB = 2, BASE = 7, READING = 8

/** Bonus for JMdict's common words; JLPT words get more, the easiest levels most. */
const JLPT_BONUS: Record<string, number> = { N5: 4000, N4: 3300, N3: 2600, N2: 1900, N1: 1200 }
const COMMON_BONUS = 800

/** JMdict's common words: the bonus for each spelling and reading, and whether it is a noun. */
export type CommonWords = Map<string, { bonus: number; noun: boolean }>

const key = (surface: string, reading: string) => `${surface}\t${reading}`

// JMdict has no potential verbs (弾ける, can play), which IPADIC lists as words of their own; they
// take the bonus of the verb they are made from, found by turning the e-row ending back: ける → く.
const POTENTIAL: Record<string, string> = { え: 'う', け: 'く', げ: 'ぐ', せ: 'す', て: 'つ', ね: 'ぬ', べ: 'ぶ', め: 'む', れ: 'る' }

export function commonWords(raw: RawWord[]): CommonWords {
  const words: CommonWords = new Map()
  for (const [kanji, kana, senses, flags, jlpt] of raw) {
    const bonus = JLPT_BONUS[jlpt] ?? ((flags & 1) === 1 ? COMMON_BONUS : 0)
    if (!bonus) continue
    const noun = senses.some(([pos]) => pos.includes('noun'))
    for (const reading of kana) {
      for (const surface of kanji) {
        const k = key(surface, kataToHira(reading))
        const current = words.get(k)
        words.set(k, { bonus: Math.max(current?.bonus ?? 0, bonus), noun: noun || !!current?.noun })
      }
    }
  }
  return words
}

// JMdict nouns IPADIC lacks for a reading, or has only as a proper noun (日本 read にほん), join as
// plain nouns at this cost.
const ADDED_NOUN_COST = 6000

export function kuromojiLexicon(tokenizer: Tokenizer<IpadicFeatures>, common: CommonWords = new Map()): Lexicon {
  const { token_info_dictionary: info, viterbi_searcher: searcher } = tokenizer as unknown as Internals
  const { dictionary, pos_buffer: features } = info
  // Feature strings are UTF-8 ending in a 0 byte; the native decoder reads them far faster than
  // kuromoji's getString, which matters with a million of them to index.
  const bytes = features.buffer
  const utf8 = new TextDecoder()
  const featuresAt = (id: number) => {
    const start = dictionary.getInt(id + 6)
    return utf8.decode(bytes.subarray(start, bytes.indexOf(0, start)))
  }
  // Reading → record offsets. Records are decoded once they are looked up.
  const byReading = new Map<string, number[]>()
  const known = new Set<string>()
  let noun: number | undefined
  for (let id = 0; id + RECORD <= dictionary.buffer.length; id += RECORD) {
    const f = featuresAt(id).split(',', READING + 1)
    const reading = f[READING]
    if (!reading || reading === '*') continue
    const hira = kataToHira(reading)
    const ids = byReading.get(hira)
    if (ids) ids.push(id)
    else byReading.set(hira, [id])
    if (f[SUB] !== '固有名詞') known.add(key(f[0]!, hira))
    if (noun === undefined && f[POS] === '名詞' && f[SUB] === '一般') noun = id
  }
  const added = new Map<string, Entry[]>()
  if (noun !== undefined) {
    for (const [k, word] of common) {
      if (!word.noun || known.has(k)) continue
      const [surface, reading] = k.split('\t') as [string, string]
      const entry = { surface, left: dictionary.getShort(noun), right: dictionary.getShort(noun + 2), cost: ADDED_NOUN_COST, pos: '名詞', sub: '一般', base: surface }
      added.set(reading, [...(added.get(reading) ?? []), entry])
    }
  }
  const decoded = new Map<string, Entry[]>()
  const costs = searcher.connection_costs
  const bonusOf = (surface: string, reading: string) => common.get(key(surface, reading))?.bonus ?? 0
  return {
    lookup(reading) {
      let entries = decoded.get(reading)
      if (!entries) {
        entries = (byReading.get(reading) ?? []).map((id) => {
          const f = featuresAt(id).split(',')
          return {
            surface: f[0]!,
            left: dictionary.getShort(id),
            right: dictionary.getShort(id + 2),
            cost: dictionary.getShort(id + 4),
            pos: f[POS]!,
            sub: f[SUB]!,
            base: f[BASE]!,
          }
        })
        entries.push(...(added.get(reading) ?? []))
        decoded.set(reading, entries)
      }
      return entries
    },
    connect: (right, left) => costs.get(right, left),
    bonus: (entry, reading) => bonusOf(entry.surface, reading),
    // JMdict lists dictionary forms, so a conjugated verb is looked up as one: 弾き/ひき as 弾く/ひく.
    verbBonus({ surface, base }, reading) {
      const read = baseReading(surface, base, reading)
      const bonus = bonusOf(base, read)
      const u = POTENTIAL[base.at(-2) ?? '']
      if (!u || !base.endsWith('る') || read.at(-2) !== base.at(-2)) return bonus
      return Math.max(bonus, bonusOf(base.slice(0, -2) + u, read.slice(0, -2) + u))
    },
  }
}
