import { describe, expect, it } from "bun:test"
import { createSeededRandom, shuffleArray } from "../random"
import { generateDateQuestion } from "@/lib/japanese/dates"
import { generateRandomNumber } from "@/lib/japanese/numbers"

describe("replayable practice sampling", () => {
    it("replays a seed exactly and preserves shuffle membership without mutating inputs", () => {
        const sample = (seed: number) => { const random = createSeededRandom(seed); return Array.from({ length: 100 }, random) }
        expect(sample(123)).toEqual(sample(123))
        expect(sample(123)).not.toEqual(sample(124))
        expect(sample(123).every(value => value >= 0 && value < 1)).toBe(true)
        const input = [1, 2, 3, 4, 5]
        expect(shuffleArray(input, createSeededRandom(0)).sort()).toEqual(input)
        expect(input).toEqual([1, 2, 3, 4, 5])
    })
    it("preserves inclusive number bounds and existing date selection formulas", () => {
        expect(generateRandomNumber(1, 99, () => 0)).toBe(1)
        expect(generateRandomNumber(1, 99, () => 0.999999)).toBe(99)
        expect(generateDateQuestion("months", undefined, () => 0).displayNumber).toBe("1")
        expect(generateDateQuestion("months", undefined, () => 0.999999).displayNumber).toBe("12")
        expect(generateDateQuestion("week_days", undefined, () => 0).displayNumber).toBe("1")
        for (const mode of ["months", "full", "week_days"] as const) {
            expect(generateDateQuestion(mode, undefined, createSeededRandom(22))).toEqual(generateDateQuestion(mode, undefined, createSeededRandom(22)))
        }
    })
})
