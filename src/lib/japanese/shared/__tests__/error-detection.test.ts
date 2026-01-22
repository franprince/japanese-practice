import { describe, it, expect, beforeAll } from "bun:test"
import { tokenizeKana, getValidRomaji, detectErrors } from "../error-detection"
import { loadKanaDictionary } from "../kana-dictionary-loader"

// Ensure dictionary is loaded before tests
beforeAll(async () => {
    await loadKanaDictionary()
})

describe("tokenizeKana", () => {
    it("tokenizes simple hiragana", () => {
        expect(tokenizeKana("あいう")).toEqual(["あ", "い", "う"])
    })

    it("tokenizes simple katakana", () => {
        expect(tokenizeKana("アイウ")).toEqual(["ア", "イ", "ウ"])
    })

    it("handles digraphs (きゃ, しゅ, ちょ)", () => {
        expect(tokenizeKana("きゃきゅきょ")).toEqual(["きゃ", "きゅ", "きょ"])
    })

    it("handles mixed single and digraph characters", () => {
        expect(tokenizeKana("ぴゃぼでだ")).toEqual(["ぴゃ", "ぼ", "で", "だ"])
    })

    it("handles sokuon (っ) combined with following char", () => {
        expect(tokenizeKana("にっぽん")).toEqual(["に", "っぽ", "ん"])
    })

    it("handles empty string", () => {
        expect(tokenizeKana("")).toEqual([])
    })

    it("tokenizes ぶぼば correctly", () => {
        expect(tokenizeKana("ぶぼば")).toEqual(["ぶ", "ぼ", "ば"])
    })
})

describe("getValidRomaji", () => {
    it("returns valid romaji for simple hiragana", async () => {
        const result = await getValidRomaji("あ")
        expect(result).toContain("a")
    })

    it("returns valid romaji for digraph", async () => {
        const result = await getValidRomaji("ぴゃ")
        expect(result).toContain("pya")
    })

    it("returns multiple valid romanizations for し", async () => {
        const result = await getValidRomaji("し")
        expect(result).toContain("shi")
        expect(result).toContain("si")
    })

    it("returns multiple valid romanizations for ふ", async () => {
        const result = await getValidRomaji("ふ")
        expect(result).toContain("fu")
        expect(result).toContain("hu")
    })

    it("returns correct romaji for ぶ, ぼ, ば", async () => {
        expect(await getValidRomaji("ぶ")).toContain("bu")
        expect(await getValidRomaji("ぼ")).toContain("bo")
        expect(await getValidRomaji("ば")).toContain("ba")
    })

    it("returns doubled consonant for sokuon+char combinations", async () => {
        expect(await getValidRomaji("っき")).toContain("kki")
        expect(await getValidRomaji("っぽ")).toContain("ppo")
        expect(await getValidRomaji("っか")).toContain("kka")
    })
})

describe("detectErrors", () => {
    describe("user examples", () => {
        it("detects partial errors: ぴゃぼでだ with 'pyaboteka'", async () => {
            const result = await detectErrors("ぴゃぼでだ", "pyaboteka")

            expect(result.characters).toHaveLength(4)

            // ぴゃ -> pya ✅
            expect(result.characters[0].kana).toBe("ぴゃ")
            expect(result.characters[0].userInput).toBe("pya")
            expect(result.characters[0].isCorrect).toBe(true)

            // ぼ -> bo ✅
            expect(result.characters[1].kana).toBe("ぼ")
            expect(result.characters[1].userInput).toBe("bo")
            expect(result.characters[1].isCorrect).toBe(true)

            // で -> te ❌ (expected de)
            expect(result.characters[2].kana).toBe("で")
            expect(result.characters[2].userInput).toBe("te")
            expect(result.characters[2].isCorrect).toBe(false)

            // だ -> ka ❌ (expected da)
            expect(result.characters[3].kana).toBe("だ")
            expect(result.characters[3].userInput).toBe("ka")
            expect(result.characters[3].isCorrect).toBe(false)

            expect(result.correctCount).toBe(2)
            expect(result.incorrectCount).toBe(2)
            expect(result.isFullyCorrect).toBe(false)
        })

        it("detects partial errors: ぶぼば with 'bugoba'", async () => {
            const result = await detectErrors("ぶぼば", "bugoba")

            expect(result.characters).toHaveLength(3)

            // ぶ -> bu ✅
            expect(result.characters[0].kana).toBe("ぶ")
            expect(result.characters[0].userInput).toBe("bu")
            expect(result.characters[0].isCorrect).toBe(true)

            // ぼ -> go ❌ (expected bo)
            expect(result.characters[1].kana).toBe("ぼ")
            expect(result.characters[1].userInput).toBe("go")
            expect(result.characters[1].isCorrect).toBe(false)

            // ば -> ba ✅
            expect(result.characters[2].kana).toBe("ば")
            expect(result.characters[2].userInput).toBe("ba")
            expect(result.characters[2].isCorrect).toBe(true)

            expect(result.correctCount).toBe(2)
            expect(result.incorrectCount).toBe(1)
            expect(result.isFullyCorrect).toBe(false)
        })

        it("handles extra characters with look-ahead matching: えいせん with 'edfjjsen'", async () => {
            const result = await detectErrors("えいせん", "edfjjsen")

            expect(result.characters).toHaveLength(4)

            // え -> e ✅ (first char matches)
            expect(result.characters[0].kana).toBe("え")
            expect(result.characters[0].isCorrect).toBe(true)

            // The algorithm should detect errors and find 'sen' later
            expect(result.incorrectCount).toBeGreaterThanOrEqual(1)
        })
    })

    describe("fully correct answers", () => {
        it("returns fully correct for exact match", async () => {
            const result = await detectErrors("あいうえお", "aiueo")

            expect(result.isFullyCorrect).toBe(true)
            expect(result.correctCount).toBe(5)
            expect(result.incorrectCount).toBe(0)
        })

        it("accepts alternate romanizations (shi vs si)", async () => {
            const result1 = await detectErrors("しま", "shima")
            const result2 = await detectErrors("しま", "sima")

            expect(result1.isFullyCorrect).toBe(true)
            expect(result2.isFullyCorrect).toBe(true)
        })

        it("accepts alternate romanizations (fu vs hu)", async () => {
            const result1 = await detectErrors("ふね", "fune")
            const result2 = await detectErrors("ふね", "hune")

            expect(result1.isFullyCorrect).toBe(true)
            expect(result2.isFullyCorrect).toBe(true)
        })
    })

    describe("fully incorrect answers", () => {
        it("detects all errors when completely wrong", async () => {
            const result = await detectErrors("あいう", "xyz")

            expect(result.isFullyCorrect).toBe(false)
            expect(result.incorrectCount).toBe(3)
        })
    })

    describe("edge cases", () => {
        it("handles empty kana word", async () => {
            const result = await detectErrors("", "abc")

            expect(result.characters).toHaveLength(0)
            expect(result.isFullyCorrect).toBe(false)
        })

        it("handles empty user input", async () => {
            const result = await detectErrors("あい", "")

            expect(result.characters).toHaveLength(2)
            expect(result.isFullyCorrect).toBe(false)
            expect(result.incorrectCount).toBe(2)
        })

        it("handles case insensitivity", async () => {
            const result = await detectErrors("あい", "AI")

            expect(result.isFullyCorrect).toBe(true)
        })

        it("trims whitespace from input", async () => {
            const result = await detectErrors("あい", "  ai  ")

            expect(result.isFullyCorrect).toBe(true)
        })
    })

    describe("digraphs and compound characters", () => {
        it("handles しゃしゅしょ correctly", async () => {
            const result = await detectErrors("しゃしゅしょ", "shashusho")

            expect(result.isFullyCorrect).toBe(true)
            expect(result.characters).toHaveLength(3)
        })

        it("handles ちゃちゅちょ correctly", async () => {
            const result = await detectErrors("ちゃちゅちょ", "chachucho")

            expect(result.isFullyCorrect).toBe(true)
        })

        it("handles mixed digraphs and singles", async () => {
            const result = await detectErrors("きょうと", "kyouto")

            expect(result.characters[0].kana).toBe("きょ")
            expect(result.characters[0].isCorrect).toBe(true)
            expect(result.characters[1].kana).toBe("う")
            expect(result.characters[2].kana).toBe("と")
        })
    })

    describe("sokuon (っ) handling", () => {
        it("handles sokuon in にっぽん as combined token", async () => {
            const result = await detectErrors("にっぽん", "nippon")

            expect(result.characters).toHaveLength(3)
            expect(result.characters[0].kana).toBe("に")
            expect(result.characters[0].userInput).toBe("ni")
            expect(result.characters[0].isCorrect).toBe(true)

            expect(result.characters[1].kana).toBe("っぽ") // combined token
            expect(result.characters[1].userInput).toBe("ppo") // doubled consonant
            expect(result.characters[1].isCorrect).toBe(true)

            expect(result.characters[2].kana).toBe("ん")
            expect(result.characters[2].userInput).toBe("n")
            expect(result.characters[2].isCorrect).toBe(true)

            expect(result.isFullyCorrect).toBe(true)
        })
    })

    describe("katakana support", () => {
        it("handles katakana correctly", async () => {
            const result = await detectErrors("アイウ", "aiu")

            expect(result.isFullyCorrect).toBe(true)
            expect(result.correctCount).toBe(3)
        })

        it("handles katakana digraphs", async () => {
            const result = await detectErrors("キャキュキョ", "kyakyukyo")

            expect(result.isFullyCorrect).toBe(true)
        })
    })
})
