// Runs the real tokenizer and the generated dictionary (npm run data, which
// `npm test` does first) on sample sentences.
import kuromoji, { type IpadicFeatures, type Tokenizer } from 'kuromoji'
import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'bun:test'
import { analyze, readingLines, transcriptions } from '../lib/analyze'
import { addWords, type RawWord } from '../lib/dictionary'

let tokenizer: Tokenizer<IpadicFeatures>
const run = (text: string) => analyze(tokenizer.tokenize(text))
const words = (text: string) => run(text).filter((s) => s.type === 'word')

beforeAll(async () => {
  addWords(JSON.parse(readFileSync('public/reader/data/words-common.json', 'utf8')) as RawWord[])
  tokenizer = await new Promise((resolve, reject) =>
    kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, t) => (err ? reject(err) : resolve(t))),
  )
})

describe('analyze', () => {
  it('joins an inflected verb into one word traced to its dictionary form', () => {
    const verb = words('本を読んでいました')[2]
    expect(verb!.surface).toBe('読んでいました')
    expect(verb!.base).toBe('読む')
    expect(verb!.parts.map((p) => p.surface)).toEqual(['読ん', 'で', 'い', 'まし', 'た'])
    expect(verb!.parts.map((p) => p.note)).toEqual([undefined, 'te-form (and / then)', 'ongoing / state', 'polite', 'past'])
    expect(verb!.entries[0]!.kanji).toContain('読む')
  })

  it('romanizes particles the way they are pronounced', () => {
    expect(words('私は学校へ本を').map((s) => s.romaji)).toEqual(['watashi', 'wa', 'gakkō', 'e', 'hon', 'o'])
  })

  it('romanizes loanwords written with small vowels', () => {
    expect(words('ファンタジーのパーティー').map((s) => s.romaji)).toEqual(['fantajī', 'no', 'pātī'])
  })

  it('uses Hepburn long vowels only where the word is pronounced long', () => {
    const romaji = (text: string) => words(text).map((s) => s.romaji)
    expect(romaji('東京')).toEqual(['tōkyō'])
    expect(romaji('お母さん')).toEqual(['okāsan'])
    expect(romaji('大きい')).toEqual(['ōkii'])
    expect(romaji('思う')).toEqual(['omou'])
    expect(romaji('場合')).toEqual(['baai'])
    expect(romaji('小売')).toEqual(['kouri'])
    expect(romaji('先生')).toEqual(['sensei'])
    expect(romaji('綺麗')).toEqual(['kirei'])
    expect(romaji('ありがとう')).toEqual(['arigatō'])
    expect(romaji('今夜')).toEqual(["kon'ya"])
  })

  it('ranks the dictionary entry that matches the part of speech first', () => {
    const [, ga] = words('猫が好き')
    expect(ga!.entries[0]!.senses[0]!.pos).toContain('particle')
  })

  it('adds furigana from the reading', () => {
    expect(words('図書館')[0]!.furigana).toEqual([{ text: '図書館', rt: 'としょかん' }])
  })

  it('builds the kana and romaji transcriptions with punctuation', () => {
    expect(transcriptions(run('猫が好きですか？'))).toEqual({
      hiragana: 'ねこがすきですか？',
      romaji: 'neko ga suki desu ka?',
    })
  })

  it('keeps lyric lines, stanza whitespace and repeated words with their original indices', () => {
    const segments = run('今 貴方と奏でよう\r\n \r\n此処に貴方と居るコト\n今 貴方と奏でよう')
    const lines = readingLines(segments)
    expect(lines.map((line) => line.text)).toEqual([
      '今 貴方と奏でよう', ' ', '此処に貴方と居るコト', '今 貴方と奏でよう',
    ])
    const indices = lines.flatMap((line) => line.segments.filter((s) => s.type === 'word').map((s) => s.index))
    expect(indices).toEqual(segments.filter((s) => s.type === 'word').map((s) => s.index))
    expect(new Set(indices).size).toBe(indices.length)
  })

  it('preserves line and stanza breaks in copied kana and romaji', () => {
    expect(transcriptions(run('猫が好きです。\r\n\r\n東京へ行く'))).toEqual({
      hiragana: 'ねこがすきです。\n\nとうきょうへいく',
      romaji: 'neko ga suki desu.\n\ntōkyō e iku',
    })
    expect(readingLines(run('猫が好きです。')).map((line) => line.text)).toEqual(['猫が好きです。'])
  })
})
