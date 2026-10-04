
import { describe, expect, it } from "bun:test"
import { normalizeRomaji, validateAnswer } from "../input"
import type { JapaneseWord } from "@/types/japanese"

describe("Japanese Input Validation", () => {
    describe("normalizeRomaji", () => {
        it("normalizes variations to standard forms", () => {
            
            expect(normalizeRomaji("susi")).toBe("sushi")
            expect(normalizeRomaji("watasi")).toBe("watashi")

            
            expect(normalizeRomaji("matu")).toBe("matsu")

            
            expect(normalizeRomaji("tiizu")).toBe("chiizu")

            
            expect(normalizeRomaji("huzi")).toBe("fuji")

            
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

        it("accepts exact matches", async () => {
            const word = mockWord("すし", "sushi")
            expect(await validateAnswer("sushi", word)).toBe(true)
            expect(await validateAnswer(" SUSHI ", word)).toBe(true)
        })

        it("accepts alternative romanizations", async () => {
            const word = mockWord("ふじ", "fuji")
            expect(await validateAnswer("fuzi", word)).toBe(true)
            expect(await validateAnswer("huzi", word)).toBe(true)

            const word2 = mockWord("ちず", "chizu")
            expect(await validateAnswer("tizu", word2)).toBe(true)
        })

        it("accepts conventional greeting readings", async () => {
            const word = mockWord("こんにちは", "konnichiha")
            expect(await validateAnswer("konnichiwa", word)).toBe(true)
            expect(await validateAnswer("konnichiha", word)).toBe(true)
            expect(validateAnswer("konbanwa", mockWord("こんばんは", "konbanha"))).toBe(true)
        })

        it.each([["は", "ha", "wa"], ["へ", "he", "e"], ["を", "wo", "o"]])("accepts the standalone %s particle equivalent", (kana, romaji, alternate) => {
            expect(validateAnswer(alternate, mockWord(kana, romaji))).toBe(true)
            expect(validateAnswer(romaji, mockWord(kana, romaji))).toBe(true)
        })

        it.each([
            ["はは", "haha", "hawa"], ["いろは", "iroha", "irowa"],
            ["このは", "konoha", "konowa"], ["へへ", "hehe", "hee"],
            ["どこへ", "dokohe", "dokoe"], ["みずを", "mizuwo", "mizuo"],
        ])("does not infer a particle from the suffix of %s", (kana, romaji, incorrect) => {
            expect(validateAnswer(incorrect, mockWord(kana, romaji))).toBe(false)
            expect(validateAnswer(romaji, mockWord(kana, romaji))).toBe(true)
        })

        it("does not apply particle or greeting equivalents to generated kana", () => {
            expect(validateAnswer("wa", mockWord("は", "ha"), "kana")).toBe(false)
            expect(validateAnswer("e", mockWord("へ", "he"), "kana")).toBe(false)
            expect(validateAnswer("konnichiwa", mockWord("こんにちは", "konnichiha"), "kana")).toBe(false)
        })

        it("does not reinterpret a lexical kanji entry as a standalone particle", () => {
            expect(validateAnswer("wa", { ...mockWord("は", "ha"), kanji: "歯", meaning: "tooth" })).toBe(false)
            expect(validateAnswer("e", { ...mockWord("へ", "he"), kanji: "屁" })).toBe(false)
        })

        it("rejects incorrect answers", async () => {
            const word = mockWord("すし", "sushi")
            expect(await validateAnswer("sashimi", word)).toBe(false)
            expect(await validateAnswer("sus", word)).toBe(false)
        })

        it("rejects a dropped letter even when the answer has a genuine double n", async () => {
            // あんな ("that sort of") is "anna" — "ana" is a real spelling
            // mistake, not an n/nn input-method ambiguity, and must not be
            // silently accepted.
            const word = mockWord("あんな", "anna")
            expect(await validateAnswer("ana", word)).toBe(false)
            expect(await validateAnswer("anna", word)).toBe(true)
        })

        it("still forgives an accidental extra n when the answer has no genuine double n", async () => {
            const word = mockWord("しんかんせん", "shinkansen")
            expect(await validateAnswer("shinnkansen", word)).toBe(true)
            expect(await validateAnswer("shinkansen", word)).toBe(true)
        })
    })
})
