import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'
import { normalizeLang, mapEntryToWord, loadWordSets } from './words-loader'
import type { LoaderDeps } from './words-loader'

// Mock dependencies for mapEntryToWord
const mockDeps: LoaderDeps = {
    characterGroups: [
        { id: 'h1', label: 'A', labelJp: 'あ', type: 'hiragana', characters: ['あ'] },
        { id: 'k1', label: 'A', labelJp: 'ア', type: 'katakana', characters: ['ア'] }
    ],
    kanaToRomaji: (t) => t === 'あ' ? 'a' : (t === 'ア' ? 'a' : t),
    hasHiragana: (t) => t === 'あ',
    hasKatakana: (t) => t === 'ア'
}

describe('words-loader', () => {
    describe('normalizeLang', () => {
        test('defaults to es', () => {
            expect(normalizeLang(undefined)).toBe('es')
            expect(normalizeLang('')).toBe('es')
        })

        test('handles explicit languages', () => {
            expect(normalizeLang('en')).toBe('en')
            expect(normalizeLang('es')).toBe('es')
        })

        test('maps ja to en', () => {
            expect(normalizeLang('ja')).toBe('en')
        })

        test('fallbacks unknown to es', () => {
            expect(normalizeLang('fr')).toBe('es')
        })
    })

    describe('mapEntryToWord', () => {
        test('maps valid hiragana entry', () => {
            const entry = {
                kana: [{ text: 'あ' }],
                sense: [{ gloss: [{ text: 'Ah' }] }],
                kanji: []
            }
            const result = mapEntryToWord(entry, mockDeps)
            expect(result).toEqual({
                kana: 'あ',
                romaji: 'a',
                type: 'hiragana',
                meaning: 'Ah',
                groups: ['h1'],
                kanji: undefined
            })
        })

        test('maps valid katakana entry', () => {
            const entry = {
                kana: [{ text: 'ア' }],
                sense: [{ gloss: [{ text: 'Ah' }] }],
                kanji: []
            }
            const result = mapEntryToWord(entry, mockDeps)
            expect(result).toEqual({
                kana: 'ア',
                romaji: 'a',
                type: 'katakana',
                meaning: 'Ah',
                groups: ['k1'],
                kanji: undefined
            })
        })

        test('returns null for missing kana', () => {
            const entry = { kana: [], sense: [] }
            expect(mapEntryToWord(entry, mockDeps)).toBeNull()
        })

        test('returns null for unknown type', () => {
            const entry = { kana: [{ text: 'unknown' }], sense: [] }
            // Mock needs to handle unknown
            const deps = { ...mockDeps, hasHiragana: () => false, hasKatakana: () => false }
            expect(mapEntryToWord(entry, deps)).toBeNull()
        })
    })
})
