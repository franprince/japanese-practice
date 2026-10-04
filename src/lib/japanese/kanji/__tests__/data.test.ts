import { describe, expect, it } from "bun:test"
import { getRandomKanji, getRandomOptions } from "../data"
import type { KanjiEntry } from "@/types/japanese"

const entry = (char: string): KanjiEntry => ({ char, reading: char })

describe("getRandomKanji", () => {
    it("returns the only entry when the list has a single item and no exclude", () => {
        const only = entry("一")
        expect(getRandomKanji([only])).toBe(only)
    })

    it("does not hang when the single-entry list equals exclude", () => {
        const only = entry("一")
        // Must return within the test's normal timeout, not loop forever.
        expect(getRandomKanji([only], only)).toBe(only)
    })

    it("never returns the excluded entry when other candidates exist", () => {
        const a = entry("一")
        const b = entry("二")
        for (let i = 0; i < 20; i++) {
            expect(getRandomKanji([a, b], a)).toBe(b)
        }
    })
})

describe("getRandomOptions", () => {
    it("always includes the correct entry among the returned options", () => {
        const correct = entry("三")
        const pool = [correct, entry("四"), entry("五"), entry("六")]
        const options = getRandomOptions(pool, correct, 3)
        expect(options).toHaveLength(3)
        expect(options.some(o => o.char === correct.char)).toBe(true)
    })

    it("excludes alternate characters with the correct reading", () => {
        const correct = { char: "一", reading: "いち" }
        const pool = [correct, { char: "壱", reading: "いち" }, { char: "弌", reading: " いち " },
            { char: "二", reading: "に" }, { char: "三", reading: "さん" }]
        for (let attempt = 0; attempt < 20; attempt++) {
            const options = getRandomOptions(pool, correct)
            expect(new Set(options.map(option => option.char))).toEqual(new Set(["一", "二", "三"]))
        }
    })

    it("does not repeat distractor readings or pad a small pool", () => {
        const correct = { char: "一", reading: "いち" }
        const pool = [correct, { char: "二", reading: "に" }, { char: "弐", reading: "に" }]
        for (let attempt = 0; attempt < 20; attempt++) {
            const options = getRandomOptions(pool, correct)
            expect(options).toHaveLength(2)
            expect(options).toContain(correct)
            expect(new Set(options.map(option => option.reading)).size).toBe(2)
        }
        expect(getRandomOptions([correct, { char: "壱", reading: "いち" }], correct)).toEqual([correct])
    })

    it("excludes empty and whitespace-only distractor readings", () => {
        const correct = { char: "一", reading: "いち" }
        const pool = [correct, { char: "空", reading: "" }, { char: "白", reading: " \t " },
            { char: "二", reading: "に" }, { char: "三", reading: "さん" }]
        expect(new Set(getRandomOptions(pool, correct).map(option => option.char)))
            .toEqual(new Set(["一", "二", "三"]))
    })
})
