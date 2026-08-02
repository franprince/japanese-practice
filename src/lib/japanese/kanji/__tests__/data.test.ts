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
})
