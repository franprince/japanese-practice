
import { describe, test, expect } from 'bun:test'
import { GAMES } from '@/lib/core'

describe('Game Registry', () => {
    test('should have all 5 games defined', () => {
        expect(GAMES).toHaveLength(5)
    })

    test('each game should have required properties', () => {
        GAMES.forEach(game => {
            expect(game).toHaveProperty('id')
            expect(game).toHaveProperty('href')
            expect(game).toHaveProperty('icon')
            expect(game).toHaveProperty('gradient')
            expect(game).toHaveProperty('titleKey')
            expect(game).toHaveProperty('descriptionKey')
        })
    })

    test('game hrefs should be unique', () => {
        const hrefs = GAMES.map(g => g.href)
        const uniqueHrefs = new Set(hrefs)
        expect(uniqueHrefs.size).toBe(GAMES.length)
    })

    test('should include words game', () => {
        const wordsGame = GAMES.find(g => g.id === 'romaji')
        expect(wordsGame).toBeDefined()
        expect(wordsGame?.href).toBe('/words')
    })

    test('should include kanji game', () => {
        const kanjiGame = GAMES.find(g => g.id === 'kanji')
        expect(kanjiGame).toBeDefined()
        expect(kanjiGame?.href).toBe('/kanji')
    })

    test('should include numbers game', () => {
        const numbersGame = GAMES.find(g => g.id === 'numbers')
        expect(numbersGame).toBeDefined()
        expect(numbersGame?.href).toBe('/numbers')
    })

    test('should include dates game', () => {
        const datesGame = GAMES.find(g => g.id === 'dates')
        expect(datesGame).toBeDefined()
        expect(datesGame?.href).toBe('/dates')
    })

    test('should include ollama practice', () => {
        const ollamaGame = GAMES.find(g => g.id === 'ollama')
        expect(ollamaGame).toBeDefined()
        expect(ollamaGame?.href).toBe('/practice/ollama')
    })
})
