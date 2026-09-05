import { describe, expect, mock, test } from "bun:test"
import { loadWordQuestion, type WordQuestionRequest } from "../question"
import { createSeededRandom } from "@/lib/core/random"
import { ConsentRequired } from "../../wordsets"
import type { JapaneseWord } from "@/types/japanese"

const word = (romaji = "a"): JapaneseWord => ({ kana: "あ", romaji, type: "hiragana", groups: ["h1"] })
const request: WordQuestionRequest = { mode: "both", gameType: "words", filter: { selectedGroups: ["h1"], minLength: 3, maxLength: 6 }, lang: "es" }
const deps = () => ({ word: mock(async () => word()), character: mock(async () => word()), random: createSeededRandom(42) })

describe("question selection", () => {
    test("vocabulary and character modes keep their requested filters and language", async () => {
        const selections = deps()
        const original = structuredClone(request)
        expect(await loadWordQuestion(request, selections)).toEqual({ word: word(), options: null })
        expect(selections.word).toHaveBeenCalledWith("both", request.filter, "es")
        expect(selections.character).not.toHaveBeenCalled()
        expect(await loadWordQuestion({ ...request, gameType: "characters" }, selections)).toEqual({ word: word(), options: null })
        expect(selections.character).toHaveBeenCalledWith("both", request.filter)
        expect(request).toEqual(original)
    })
    test("Guess rejects answer/duplicate distractors and stops after two distinct candidates", async () => {
        const values = [word("a"), word("a"), word("i"), word("i"), word("u")]
        const selections = { ...deps(), character: mock(async () => values.shift() ?? null) }
        const result = await loadWordQuestion({ ...request, gameType: "guess" }, selections)
        expect(selections.character).toHaveBeenCalledTimes(5)
        expect(selections.character).toHaveBeenLastCalledWith("both", { ...request.filter, minLength: 1, maxLength: 1 })
        expect(result.word).toEqual(word())
        expect([...result.options!].sort()).toEqual(["a", "i", "u"])
        expect(selections.word).not.toHaveBeenCalled()
    })
    test("Guess fills fallbacks after ten unusable attempts without mutating its filter", async () => {
        const selections = deps()
        const result = await loadWordQuestion({ ...request, gameType: "guess" }, selections)
        expect(selections.character).toHaveBeenCalledTimes(11)
        expect(result.options).toHaveLength(3)
        expect(new Set(result.options).size).toBe(3)
        expect(result.options!.filter(value => value === "a")).toHaveLength(1)
        expect(request.filter).toEqual({ selectedGroups: ["h1"], minLength: 3, maxLength: 6 })
    })
    test("empty pools do not generate distractors or playable placeholders", async () => {
        const selections = { ...deps(), character: mock(async () => null) }
        expect(await loadWordQuestion({ ...request, gameType: "guess" }, selections)).toEqual({ word: null, options: null })
        expect(selections.character).toHaveBeenCalledTimes(1)
    })
    test("preserves typed primary failure and the existing partial distractor failure", async () => {
        const error = new ConsentRequired("consent required")
        const selections = deps()
        selections.word.mockRejectedValue(error)
        expect(await loadWordQuestion(request, selections)).toEqual({ word: null, options: null, error })
        selections.character.mockImplementationOnce(async () => word()).mockRejectedValue(error)
        expect(await loadWordQuestion({ ...request, gameType: "guess" }, selections)).toEqual({ word: word(), options: null, error })
    })
})
