import { describe, expect, test } from 'bun:test'
import { generateWeekDayQuestion, generateWeekDaysQuestion, generateMonthQuestion, daysOfWeek } from './japanese-dates'

describe('japanese-dates', () => {
    describe('generateWeekDayQuestion', () => {
        test('returns a valid week day question', () => {
            const result = generateWeekDayQuestion()
            expect(result.display).toBeDefined()
            expect(result.answer).toBeDefined()
            expect(result.romaji).toBeDefined()


            const match = Object.values(daysOfWeek).find(d => d.romaji === result.display)
            expect(match).toBeDefined()
            expect(match?.reading).toBe(result.answer)
        })

        test('uses translation when translator provided', () => {
            const mockT = (key: string) => `Translated: ${key}`

            const result = generateWeekDayQuestion(mockT)
            expect(result.display).toContain('Translated: day.')
        })
    })

    describe('generateWeekDaysQuestion', () => {
        test('returns a day question', () => {
            const result = generateWeekDaysQuestion()
            expect(result.display).toBeDefined()

            const match = Object.values(daysOfWeek).find(d => d.romaji === result.display)
            expect(match).toBeDefined()
        })

        test('uses translation when translator provided', () => {
            const mockT = (key: string) => `Translated: ${key}`

            const result = generateWeekDaysQuestion(mockT)
            expect(result.display).toContain('Translated: day.')
        })
    })

    describe('generateMonthQuestion', () => {
        test('returns a month question with name if translator provided', () => {
            const mockT = (key: string) => `Translated: ${key}`

            const result = generateMonthQuestion(mockT)
            expect(result.display).toContain('Translated: month.')
        })

        test('returns a month question with English name if no translator', () => {
            const result = generateMonthQuestion()

            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"]
            expect(monthNames).toContain(result.display)
        })
    })
})
