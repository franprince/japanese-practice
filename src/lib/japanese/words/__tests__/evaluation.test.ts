import { describe, expect, mock, test } from "bun:test"
import { evaluateWordAnswer } from "../evaluation"
import type { JapaneseWord, ErrorDetectionResult } from "@/types/japanese"

const word: JapaneseWord = { kana: "し", romaji: "shi", type: "hiragana", groups: ["h2"] }
const details: ErrorDetectionResult = {
    isFullyCorrect: false, correctCount: 0, incorrectCount: 1, extraInput: "",
    characters: [{ kana: "し", expectedRomaji: ["shi", "si"], userInput: "wrong", isCorrect: false }],
}
describe("answer evaluation", () => {
    test("trimmed/case/variant matches and all Guess answers stay synchronous", () => {
        const detect = mock(async () => details)
        for (const answer of ["shi", " SHI ", "si"]) {
            expect(evaluateWordAnswer(word, answer, "words", detect)).toEqual({ isCorrect: true, errorDetails: null })
        }
        expect(evaluateWordAnswer(word, "wrong", "guess", detect)).toEqual({ isCorrect: false, errorDetails: null })
        expect(detect).not.toHaveBeenCalled()
    })
    test("incorrect non-Guess answers await diagnostics without mutating the question/results", async () => {
        const original = structuredClone({ word, details })
        const detect = mock(async () => details)
        const outcome = evaluateWordAnswer(word, " wrong ", "characters", detect)
        expect(outcome).toBeInstanceOf(Promise)
        expect(await outcome).toEqual({ isCorrect: false, errorDetails: details })
        expect(detect).toHaveBeenCalledWith("し", "wrong")
        expect({ word, details }).toEqual(original)
    })
    test("fully correct diagnostics promote the answer and hide error details", async () => {
        const detect = mock(async () => ({ ...details, isFullyCorrect: true }))
        expect(await evaluateWordAnswer(word, "alternate", "words", detect)).toEqual({ isCorrect: true, errorDetails: null })
    })
    test("rejected or synchronously throwing diagnostics preserve the incorrect result and original error", async () => {
        const error = new Error("dictionary unavailable")
        for (const detect of [async () => { throw error }, () => { throw error }]) {
            expect(await evaluateWordAnswer(word, "wrong", "words", detect)).toEqual({ isCorrect: false, errorDetails: null, diagnosticError: error })
        }
    })
    test("a genuine doubled n does not accept its collapsed spelling in Guess mode", () => {
        const doubled = { ...word, kana: "あんな", romaji: "anna" }
        expect(evaluateWordAnswer(doubled, "ana", "guess")).toEqual({ isCorrect: false, errorDetails: null })
    })
})
