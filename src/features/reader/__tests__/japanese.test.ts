import { describe, expect, it } from 'bun:test'
import {
  furigana,
  hepburn,
  hiraToKata,
  japaneseGlyphs,
  kataToHira,
  looksLikeRomaji,
  romajiToKana,
  romanizePunctuation,
  toRomaji,
} from '../lib/japanese'

describe('furigana', () => {
  it('puts readings over kanji runs only', () => {
    expect(furigana('食べる', 'たべる')).toEqual([{ text: '食', rt: 'た' }, { text: 'べる' }])
    expect(furigana('図書館', 'としょかん')).toEqual([{ text: '図書館', rt: 'としょかん' }])
    expect(furigana('お茶', 'おちゃ')).toEqual([{ text: 'お' }, { text: '茶', rt: 'ちゃ' }])
  })
  it('accepts katakana readings', () => {
    expect(furigana('私', 'ワタシ')).toEqual([{ text: '私', rt: 'わたし' }])
  })
  it('falls back to one ruby over the whole word when the reading does not line up', () => {
    expect(furigana('食べる', 'くう')).toEqual([{ text: '食べる', rt: 'くう' }])
  })
  it('leaves kana and missing readings alone', () => {
    expect(furigana('ねこ', 'ねこ')).toEqual([{ text: 'ねこ' }])
    expect(furigana('猫', '')).toEqual([{ text: '猫' }])
  })
})

describe('kana and romaji', () => {
  it('converts between hiragana and katakana, keeping ー', () => {
    expect(kataToHira('ラーメン')).toBe('らーめん')
    expect(hiraToKata('らーめん')).toBe('ラーメン')
  })
  it('writes ー as a macron (Hepburn)', () => {
    expect(toRomaji('らーめん')).toBe('rāmen')
    expect(toRomaji('タクシー')).toBe('takushī')
    expect(toRomaji('とーきょー')).toBe('tōkyō')
    // Without ー, kana are spelled as written.
    expect(toRomaji('とうきょう')).toBe('toukyou')
  })
  it('joins long vowels Hepburn-style in words without a pronunciation', () => {
    const cases: [string, string, boolean?][] = [
      ['とうきょう', 'tōkyō'],
      ['べんきょう', 'benkyō'],
      ['すうがく', 'sūgaku'],
      ['きゅうり', 'kyūri'],
      ['おおきい', 'ōkii'],
      ['トウ', 'tō'],
      ['おもう', 'omou', true],
      ['いう', 'iu', true],
      ['ばあい', 'baai'],
      ['せんせい', 'sensei'],
      ['おにいさん', 'oniisan'],
    ]
    for (const [kana, romaji, verb] of cases) expect(hepburn(kana, verb), kana).toBe(romaji)
  })
  it('spells loanword sounds written with a small vowel', () => {
    const cases: Record<string, string> = {
      ファンタジー: 'fantajī',
      パーティー: 'pātī',
      ディズニー: 'dizunī',
      フォーク: 'fōku',
      ウィキ: 'wiki',
      ヴァイオリン: 'vaiorin',
      デュエット: 'dyuetto',
      ツァー: 'tsā',
      ウェブ: 'webu',
      ベッティング: 'bettingu',
      チェック: 'chekku',
      シェフ: 'shefu',
      ヴ: 'vu',
    }
    for (const [kana, romaji] of Object.entries(cases)) expect(toRomaji(kana), kana).toBe(romaji)
  })
  it('keeps syllabic n apart from a following vowel', () => {
    expect(toRomaji('こんや')).toBe("kon'ya")
    expect(toRomaji('ふぁんあ')).toBe("fan'a")
  })
  it('reads lone wa / o / e between words as particles', () => {
    expect(romajiToKana('watashi wa sushi o tabemasu')).toBe('わたしはすしをたべます')
    expect(romajiToKana('gakkou e ikimasu')).toBe('がっこうへいきます')
    expect(romajiToKana('Tōkyō')).toBe('とうきょう')
  })
  it('preserves lyric lines and stanzas when converting romaji to kana', () => {
    expect(romajiToKana('watashi wa sushi o tabemasu\r\n\r\nTōkyō e ikimasu'))
      .toBe('わたしはすしをたべます\n\nとうきょうへいきます')
  })
  it('tells romaji from English', () => {
    expect(looksLikeRomaji('watashi wa gakusei desu')).toBe(true)
    expect(looksLikeRomaji('konnichiwa!')).toBe(true)
    expect(looksLikeRomaji('I love you')).toBe(false)
    expect(looksLikeRomaji('hello')).toBe(false)
    expect(looksLikeRomaji('')).toBe(false)
  })
  it('romanizes Japanese punctuation', () => {
    expect(romanizePunctuation('はい、そうです。')).toBe('はい,そうです.')
  })
})

describe('japaneseGlyphs', () => {
  it('swaps Chinese-only glyphs in Japanese text for the kanji Japanese uses', () => {
    expect(japaneseGlyphs('步いてたら')).toBe('歩いてたら')
    expect(japaneseGlyphs('届かない场所へ')).toBe('届かない場所へ')
    expect(japaneseGlyphs('说明して、发表した')).toBe('説明して、発表した')
  })

  it('keeps kanji Japanese also writes, even where Chinese means something else', () => {
    expect(japaneseGlyphs('夢が叶う、皇后と国')).toBe('夢が叶う、皇后と国')
  })

  it('leaves text without kana alone', () => {
    expect(japaneseGlyphs('我们在这里散步')).toBe('我们在这里散步')
  })
})
