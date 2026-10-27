import { toHiragana as wkToHiragana, toRomaji as wkToRomaji } from 'wanakana'

const KANJI = /[\p{Script=Han}々〆ヶ]/u
const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〆ー]/u

export const hasKanji = (s: string) => KANJI.test(s)
export const hasJapanese = (s: string) => JAPANESE.test(s)
export const isKanji = (ch: string) => KANJI.test(ch)

/** Katakana to hiragana by code point; unlike wanakana it keeps ー as written. */
export function kataToHira(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
}

export function hiraToKata(s: string): string {
  return s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
}

const PUNCTUATION: Record<string, string> = {
  '。': '.', '、': ',', '！': '!', '？': '?', '「': '"', '」': '"', '『': '"', '』': '"',
  '（': '(', '）': ')', '・': ' ', '…': '...', '～': '~', '：': ':', '；': ';', '　': ' ',
}

export function romanizePunctuation(s: string): string {
  return s.replace(/[。、！？「」『』（）・…～：；　]/g, (c) => PUNCTUATION[c]!)
}

// Sounds written with a small vowel, mostly in loanwords. wanakana reads the
// small vowel as its own syllable (ファ → "fua"), so these are spelled here.
const EXTENDED: Record<string, string> = {
  ふぁ: 'fa', ふぃ: 'fi', ふぇ: 'fe', ふぉ: 'fo', ふゅ: 'fyu',
  てぃ: 'ti', でぃ: 'di', とぅ: 'tu', どぅ: 'du', てゅ: 'tyu', でゅ: 'dyu',
  うぃ: 'wi', うぇ: 'we', うぉ: 'wo',
  ゔぁ: 'va', ゔぃ: 'vi', ゔぇ: 've', ゔぉ: 'vo', ゔゅ: 'vyu',
  つぁ: 'tsa', つぃ: 'tsi', つぇ: 'tse', つぉ: 'tso',
  くぁ: 'kwa', くぃ: 'kwi', くぇ: 'kwe', くぉ: 'kwo', ぐぁ: 'gwa',
  すぃ: 'si', ずぃ: 'zi', いぇ: 'ye',
}
// A small っ before one of them doubles its consonant (ベッティング → betting).
const EXTENDED_SOUND = new RegExp(`(っ?)(${Object.keys(EXTENDED).join('|')})`, 'g')

const MACRON: Record<string, string> = { a: 'ā', i: 'ī', u: 'ū', e: 'ē', o: 'ō' }

/**
 * Modified Hepburn romaji. A ー is a long vowel and gets a macron (ラーメン →
 * rāmen, ファンタジー → fantajī); everything else is spelled as written
 * (とう → tou). Pass text whose long vowels are already marked with ー: the
 * analyzer uses the tokenizer's pronunciation, other callers use hepburn().
 */
export function toRomaji(kana: string): string {
  const spelled = kataToHira(kana).replace(EXTENDED_SOUND, (_, tsu: string, sound: string) => {
    const r = EXTENDED[sound]!
    return (tsu ? r[0] : '') + r
  })
  // Latin letters pass through wanakana untouched; a ー after them still becomes "-".
  return wkToRomaji(spelled).replace(/([aeiou])-/g, (_, v: string) => MACRON[v]!)
}

const O_SOUND = /[おこごそぞとどのほぼぽもよょろをぉ]/
const U_SOUND = /[うくぐすずつづぬふぶぷむゆゅるぅ]/

/**
 * Marks the long vowels Hepburn joins, in words without a pronunciation from
 * the tokenizer: おう / おお → ō and うう → ū (とうきょう → tōkyō). ああ, いい,
 * ええ and えい stay as written, since they so often span two parts of a word
 * (場合 baai, 先生 sensei). A verb's final う is its ending (思う → omou).
 */
export function longVowels(kana: string, verb = false): string {
  const chars = [...kataToHira(kana)]
  return chars
    .map((c, i) => {
      const prev = chars[i - 1] ?? ''
      if (verb && i === chars.length - 1) return c
      if (c === 'う' && (O_SOUND.test(prev) || U_SOUND.test(prev))) return 'ー'
      if (c === 'お' && O_SOUND.test(prev)) return 'ー'
      return c
    })
    .join('')
}

export const hepburn = (kana: string, verb = false) => toRomaji(longVowels(kana, verb))

const MACRONS: Record<string, string> = { ā: 'aa', ī: 'ii', ū: 'uu', ē: 'ee', ō: 'ou', â: 'aa', î: 'ii', û: 'uu', ê: 'ee', ô: 'ou' }
const PARTICLES: Record<string, string> = { wa: 'は', wo: 'を', o: 'を', e: 'へ' }

/** Romaji text to hiragana; words typed alone as "wa", "wo"/"o" and "e" become the particles は, を and へ. */
export function romajiToKana(text: string): string {
  return text
    .toLowerCase()
    .replace(/\r\n?/g, '\n')
    .replace(/[āīūēōâîûêô]/g, (c) => MACRONS[c]!)
    .split(/(\s+)/)
    .map((w, i, all) => {
      if (/^\s+$/.test(w)) return w.replace(/[^\n]/g, '')
      const particle = PARTICLES[w]
      // Treat it as a particle only between other words.
      if (particle && i > 0 && i < all.length - 1) return particle
      return wkToHiragana(w)
    })
    .join('')
}

// One Hepburn/wāpuro syllable, a syllabic n, or the first half of a double consonant.
const SYLLABLE = "(?:(?:[kgsztdnhbpmr]y?|ch|sh|j|jy|ts|f|w|y)?[aeiou]|n'?|([kgsztdhbpmrfjc])(?=\\1)|-)"
const ROMAJI_WORD = new RegExp(`^${SYLLABLE}+$`)

/** True when every word could be romaji (so "sushi o tabemasu" passes and "I love you" does not). */
export function looksLikeRomaji(text: string): boolean {
  const words = text
    .toLowerCase()
    .replace(/[āīūēōâîûêô]/g, (c) => MACRONS[c]!)
    .replace(/[.,!?"'()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  return words.length > 0 && words.every((w) => ROMAJI_WORD.test(w))
}

export type FuriganaPart = { text: string; rt?: string }

/** Splits a word into kanji runs with their readings, keeping okurigana bare: 食べる/たべる → 食(た)べる. */
export function furigana(surface: string, reading: string): FuriganaPart[] {
  if (!reading || !hasKanji(surface)) return [{ text: surface }]
  const runs = surface.match(/[\p{Script=Han}々〆ヶ]+|[^\p{Script=Han}々〆ヶ]+/gu) ?? [surface]
  const pattern = runs
    .map((r) => (hasKanji(r) ? '(.+?)' : `(${kataToHira(r).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`))
    .join('')
  const match = new RegExp(`^${pattern}$`).exec(kataToHira(reading))
  if (!match) return [{ text: surface, rt: kataToHira(reading) }]
  return runs.map((r, i) => (hasKanji(r) ? { text: r, rt: match[i + 1] } : { text: r }))
}
