import { describe, expect, test } from 'bun:test'
import { generateWeekDayQuestion, generateWeekDaysQuestion, generateMonthQuestion, generateDateQuestion, daysOfWeek } from "../dates"

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

    describe('generateDateQuestion', () => {
        test('week_days mode always returns a weekday question, regardless of a stray extra arg', () => {
            // generateDateQuestion no longer accepts a useNumbers flag — it must
            // always produce a real weekday question for "week_days" mode, not
            // silently switch to an unrelated day-of-month question.
            for (let i = 0; i < 20; i++) {
                const result = generateDateQuestion("week_days")
                const match = Object.values(daysOfWeek).find(d => d.romaji === result.romaji)
                expect(match).toBeDefined()
                expect(Number(result.displayNumber)).toBeGreaterThanOrEqual(1)
                expect(Number(result.displayNumber)).toBeLessThanOrEqual(7)
            }
        })

        test('full mode never generates a calendar-invalid date', () => {
            const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
            for (let i = 0; i < 500; i++) {
                const result = generateDateQuestion("full")
                const [month, day] = result.display.split("/").map(Number)
                expect(month).toBeGreaterThanOrEqual(1)
                expect(month).toBeLessThanOrEqual(12)
                expect(day).toBeGreaterThanOrEqual(1)
                expect(day).toBeLessThanOrEqual(daysInMonth[month! - 1]!)
            }
        })
    })
})
