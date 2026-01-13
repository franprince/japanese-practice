
import { describe, expect, it } from "bun:test"
import { validateAnswer, normalizeRomaji } from "./japanese-input"
import type { JapaneseWord } from "./japanese-words"

describe("Japanese Input Validation", () => {
    describe("normalizeRomaji", () => {
        it("normalizes variations to standard forms", () => {
            // si -> shi
            expect(normalizeRomaji("susi")).toBe("sushi")
            expect(normalizeRomaji("watasi")).toBe("watashi")

            // tu -> tsu
            expect(normalizeRomaji("matu")).toBe("matsu")

            // ti -> chi
            expect(normalizeRomaji("tiizu")).toBe("chiizu")

            // hu -> fu
            expect(normalizeRomaji("huzi")).toBe("fuji")

            // compounds
            expect(normalizeRomaji("sya")).toBe("sha")
            expect(normalizeRomaji("syu")).toBe("shu")
            expect(normalizeRomaji("syo")).toBe("sho")
            expect(normalizeRomaji("tya")).toBe("cha")
            expect(normalizeRomaji("zya")).toBe("ja")
        })

        it("handles double n normalization", () => {
            expect(normalizeRomaji("shinkansen")).toBe("shinkansen")
            expect(normalizeRomaji("shinkansen")).toBe(normalizeRomaji("shinnkansen"))
        })
    })

    describe("validateAnswer", () => {
        const mockWord = (kana: string, romaji: string): JapaneseWord => ({
            kana,
            romaji,
            type: "hiragana",
            groups: []
        })

        it("accepts exact matches", () => {
            const word = mockWord("すし", "sushi")
            expect(validateAnswer("sushi", word)).toBe(true)
            expect(validateAnswer(" SUSHI ", word)).toBe(true)
        })

        it("accepts alternative romanizations", () => {
            const word = mockWord("ふじ", "fuji")
            expect(validateAnswer("fuzi", word)).toBe(true)
            expect(validateAnswer("huzi", word)).toBe(true)

            const word2 = mockWord("ちず", "chizu")
            expect(validateAnswer("tizu", word2)).toBe(true)
        })

        it("accepts wa for ha particle", () => {
            const word = mockWord("こんにちは", "konnichiha")
            expect(validateAnswer("konnichiwa", word)).toBe(true)
            expect(validateAnswer("konnichiha", word)).toBe(true)
        })

        it("accepts e for he particle", () => {
            // "he" is rarely used alone as "he" sound in words unless it's a particle "to/towards"
            // Example: どこへ (dokohe -> dokoe)
            const word = mockWord("どこへ", "dokohe")
            expect(validateAnswer("dokoe", word)).toBe(true)
            expect(validateAnswer("dokohe", word)).toBe(true)
        })

        it("accepts o for wo particle", () => {
            // "wo" is pronounced "o" in modern Japanese
            // Example: みずを (mizuwo -> mizuo)
            const word = mockWord("みずを", "mizuwo")
            expect(validateAnswer("mizuo", word)).toBe(true)
            expect(validateAnswer("mizuwo", word)).toBe(true)
        })

        it("rejects incorrect answers", () => {
            const word = mockWord("すし", "sushi")
            expect(validateAnswer("sashimi", word)).toBe(false)
            expect(validateAnswer("sus", word)).toBe(false)
        })
    })
})
