import { describe, expect, it } from 'bun:test'
import { convertible, imeInput, type ImeResult } from '../lib/ime'

/** Types `keys` one at a time at the caret, as the textarea would, starting from `before|after`. */
function type(keys: string, before = '', after = ''): ImeResult {
  let state: ImeResult = { value: before + after, caret: before.length }
  for (const key of keys) {
    const value = state.value.slice(0, state.caret) + key + state.value.slice(state.caret)
    state = imeInput(value, state.caret + 1, key, state.pending)
  }
  return state
}

describe('imeInput', () => {
  it('turns syllables into hiragana as they are typed', () => {
    expect(type('watashi').value).toBe('わたし')
    expect(type('kyou').value).toBe('きょう')
    expect(type('kitte').value).toBe('きって')
  })

  it('keeps an incomplete syllable as romaji until it is finished', () => {
    expect(type('ky')).toEqual({ value: 'ky', caret: 2, pending: { start: 0, end: 2 } })
    expect(type('kan')).toEqual({ value: 'かn', caret: 2, pending: { start: 1, end: 2 } })
    expect(type('kya').pending).toBeUndefined()
  })

  it('writes ん for nn, n\' and an n before another consonant', () => {
    expect(type('konnnichiha').value).toBe('こんにちは')
    expect(type('konnichiha').value).toBe('こんいちは')
    expect(type("kan'i").value).toBe('かんい')
    expect(type('sanpo').value).toBe('さんぽ')
    expect(type('hon.').value).toBe('ほん。')
  })

  it('writes katakana for capitals and Japanese punctuation', () => {
    expect(type('RA-MENN').value).toBe('ラーメン')
    expect(type('RA-MEN').value).toBe('ラーメN')
    expect(type('nani?').value).toBe('なに？')
    expect(type('hai, sou desu!').value).toBe('はい、 そう です！')
  })

  it('inserts at the caret and leaves the rest of the text alone', () => {
    expect(type('ga', 'watashi', ' desu')).toEqual({ value: 'watashiが desu', caret: 8, pending: undefined })
  })

  it('does not join romaji that was there before the input method was on', () => {
    expect(type('a', 'k').value).toBe('kあ')
  })

  it('leaves text it did not insert unchanged', () => {
    expect(imeInput('abc', 3, 'x')).toEqual({ value: 'abc', caret: 3 })
  })
})

describe('convertible', () => {
  it('accepts typed ASCII only', () => {
    expect(convertible('a')).toBe(true)
    expect(convertible('-')).toBe(true)
    expect(convertible('あ')).toBe(false)
    expect(convertible('\n')).toBe(false)
    expect(convertible(null)).toBe(false)
  })
})
