import type { IpadicFeatures } from 'kuromoji'
import { lookup, rankEntries, type Word, type WordClass } from './dictionary'
import { describePos, grammarNote } from './grammar'
import { furigana, hasKanji, kataToHira, romanizePunctuation, toRomaji, type FuriganaPart } from './japanese'

type Tok = {
  surface: string
  base: string
  reading: string
  /** In hiragana, with long vowels as ー: 東京 → とーきょー, 思う → おもう. */
  pronunciation: string
  pos: string
  detail: string
  conjugatedForm: string
}

export type Part = { surface: string; base: string; note?: string }

export type Segment = {
  index: number
  type: 'word' | 'punct' | 'space'
  surface: string
  reading: string
  romaji: string
  /** Dictionary form of the head word (食べました → 食べる). */
  base: string
  posLabel: string
  furigana: FuriganaPart[]
  entries: Word[]
  /** The head word and the inflections or helpers joined to it, when there are any. */
  parts: Part[]
}

const known = (s: string | undefined) => (s && s !== '*' ? s : '')

function toTok(t: IpadicFeatures): Tok {
  const surface = t.surface_form
  let reading = kataToHira(known(t.reading))
  if (!reading && !hasKanji(surface)) reading = kataToHira(surface)
  return {
    surface,
    base: known(t.basic_form) || surface,
    reading,
    pronunciation: kataToHira(known(t.pronunciation)),
    pos: t.pos,
    detail: t.pos_detail_1,
    conjugatedForm: known(t.conjugated_form),
  }
}

/** Joins runs of nouns that JMdict lists as one word but the tokenizer split (e.g. 日本+料理). */
function mergeCompounds(toks: Tok[]): Tok[] {
  const out: Tok[] = []
  for (let i = 0; i < toks.length; i++) {
    let merged: Tok | undefined
    for (let len = Math.min(4, toks.length - i); len >= 2 && !merged; len--) {
      const run = toks.slice(i, i + len)
      if (!run.every((t) => t.pos === '名詞' || t.pos === '接頭詞') || run.some((t) => t.detail === '数')) continue
      const surface = run.map((t) => t.surface).join('')
      if (!hasKanji(surface) || !lookup(surface).some((w) => w.kanji.includes(surface))) continue
      const joined = (key: 'reading' | 'pronunciation') => (run.every((t) => t[key]) ? run.map((t) => t[key]).join('') : '')
      merged = {
        ...run[run.length - 1]!,
        surface,
        base: surface,
        reading: joined('reading'),
        pronunciation: joined('pronunciation'),
        pos: '名詞',
        detail: '一般',
      }
      i += len - 1
    }
    out.push(merged ?? toks[i]!)
  }
  return out
}

/** Whether a token continues the verb/adjective group before it (食べ+まし+た, 読ん+で+い+ます). */
function continues(t: Tok): boolean {
  if (t.pos === '助動詞') return true
  if (t.pos === '助詞' && t.detail === '接続助詞') return /^(て|で|ば|ちゃ|じゃ)$/.test(t.surface)
  if (t.pos === '動詞' || t.pos === '形容詞') return t.detail === '非自立' || t.detail === '接尾'
  return false
}

function groupTokens(toks: Tok[]): Tok[][] {
  const groups: Tok[][] = []
  let verbal = false
  for (const t of toks) {
    const current = groups[groups.length - 1]
    const suruAfterNoun =
      current?.length === 1 && current[0]!.detail === 'サ変接続' && t.pos === '動詞' && t.base === 'する'
    if (current && ((verbal && continues(t)) || suruAfterNoun)) {
      current.push(t)
      verbal = true
      continue
    }
    groups.push([t])
    verbal = t.pos === '動詞' || t.pos === '形容詞' || t.pos === '助動詞'
  }
  return groups
}

/** Reading of the dictionary form, from the surface reading: 食べ/たべ + る → たべる. */
function baseReading(t: Tok): string {
  if (!t.reading) return ''
  if (t.surface === t.base) return t.reading
  let common = 0
  while (common < t.surface.length && t.surface[common] === t.base[common]) common++
  const kanaTail = t.surface.slice(common)
  const stem = kataToHira(t.reading).slice(0, t.reading.length - kataToHira(kanaTail).length)
  return stem + kataToHira(t.base.slice(common))
}

/**
 * A token as Hepburn spells it, in kana: the pronunciation's long vowels
 * (東京 → とーきょー → tōkyō) and particles as said (は → わ, を → お), except
 * that ii and ei stay as written (兄さん niisan, 先生 sensei).
 */
function spoken(t: Tok, reading: string): string {
  const said = [...t.pronunciation]
  const written = [...reading]
  if (!said.length || said.length !== written.length) return reading
  return said.map((c, i) => (c === 'ー' && written[i] === 'い' ? 'い' : c === 'を' ? 'お' : c)).join('')
}

function toSegment(group: Tok[], index: number): Segment {
  // Groups are never empty.
  const head = group[0]!
  if (head.pos === '記号' || (!head.surface.trim() && head.surface)) {
    const space = !head.surface.trim()
    return {
      index,
      type: space ? 'space' : 'punct',
      surface: head.surface,
      reading: head.surface,
      romaji: space ? ' ' : romanizePunctuation(head.surface),
      base: head.surface,
      posLabel: 'symbol',
      furigana: [{ text: head.surface }],
      entries: [],
      parts: [],
    }
  }

  const { label, cls } = describePos(head.pos, head.detail)
  const surface = group.map((t) => t.surface).join('')
  const readings = group.map((t) => t.reading || (hasKanji(t.surface) ? '' : t.surface))

  let entries = lookup(head.base)
  if (!entries.length && head.surface !== head.base) entries = lookup(head.surface)
  entries = rankEntries(entries, { form: head.base, reading: baseReading(head), cls: cls as WordClass | undefined })

  // Words outside the tokenizer's dictionary come back without a reading; borrow JMdict's.
  if (!readings[0] && entries[0]) readings[0] = entries[0].kana[0]!
  const reading = readings.every(Boolean) ? readings.join('') : ''

  const verbal = head.pos === '動詞' || head.pos === '形容詞'

  return {
    index,
    type: 'word',
    surface,
    reading,
    romaji: reading ? toRomaji(group.map((t, i) => spoken(t, readings[i]!)).join('')) : surface,
    base: head.base,
    posLabel: label,
    furigana: group.flatMap((t, i) => furigana(t.surface, readings[i]!)),
    entries,
    parts:
      group.length > 1
        ? group.map((t, i) => ({ surface: t.surface, base: t.base, note: i ? grammarNote(t, verbal) : undefined }))
        : [],
  }
}

export function analyze(tokens: IpadicFeatures[]): Segment[] {
  return groupTokens(mergeCompounds(tokens.map(toTok))).map(toSegment)
}

export type ReadingLine = { text: string; segments: Segment[] }

/** Keep stanza breaks without changing the indices used to select words. */
export function readingLines(segments: Segment[]): ReadingLine[] {
  const lines: Segment[][] = [[]]
  for (const s of segments) {
    if (s.type !== 'space' || !/[\r\n]/.test(s.surface)) {
      lines[lines.length - 1]!.push(s)
      continue
    }
    s.surface.split(/\r\n?|\n/).forEach((surface, i) => {
      if (i) lines.push([])
      if (surface) lines[lines.length - 1]!.push({ ...s, surface, reading: surface, romaji: surface })
    })
  }
  return lines.map((line) => ({ text: line.map((s) => s.surface).join(''), segments: line }))
}

export function transcriptions(segments: Segment[]) {
  const hiragana = segments.map((s) => s.reading || s.surface).join('').replace(/\r\n?/g, '\n')
  let romaji = ''
  for (const s of segments) {
    if (s.type === 'word') romaji += (romaji && !/[\s"(]$/.test(romaji) ? ' ' : '') + s.romaji
    else if (s.type === 'space') romaji += s.surface.replace(/\r\n?/g, '\n')
    else romaji += s.romaji + (/[.,!?:;]$/.test(s.romaji) ? ' ' : '')
  }
  return { hiragana, romaji: romaji.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).join('\n').trim() }
}
