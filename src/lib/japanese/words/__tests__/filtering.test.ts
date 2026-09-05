import { describe, expect, test } from "bun:test"
import { buildFilterKey, clampWordsetForMobile, filterWordPool, selectWordPool } from "../filtering"
import { createSeededRandom } from "@/lib/core/random"
import type { JapaneseWord } from "@/types/japanese"

const word = (kana: string, groups = ["a"]): JapaneseWord => ({ kana, groups, type: "hiragana", romaji: "a" })
describe("candidate filtering boundaries", () => {
    test("mobile sampling caps large pools, keeps unique members, and preserves the source", () => {
        const source = Array.from({ length: 1600 }, (_, i) => word(`あ${i}`))
        const original = [...source]
        const sample = clampWordsetForMobile(source, true, createSeededRandom(3))
        expect(sample).toHaveLength(1500)
        expect(new Set(sample).size).toBe(1500)
        expect(sample.every(item => source.includes(item))).toBe(true)
        expect(source).toEqual(original)
        expect(clampWordsetForMobile(source, false)).toBe(source)
        expect(clampWordsetForMobile(sample, true)).toBe(sample)
    })
    test("cache keys preserve policy distinctions and normalize group order without mutating it", () => {
        const filter = { selectedGroups: ["b", "a"], minLength: 1, maxLength: 4 }
        const original = structuredClone(filter)
        const key = buildFilterKey("both", filter, "en", false)
        expect(buildFilterKey("both", { ...filter, selectedGroups: ["a", "b"] }, "en", false)).toBe(key)
        const keys = [key, buildFilterKey("both", filter, "en", true), buildFilterKey("both", filter, "es", false),
            buildFilterKey("hiragana", filter, "en", false), buildFilterKey("both", { ...filter, minLength: 2 }, "en", false),
            buildFilterKey("both", undefined, "en", false)]
        expect(new Set(keys).size).toBe(keys.length)
        expect(filter).toEqual(original)
    })
    test("blacklist and inclusive filters work independently without modifying datasets", () => {
        const first = word("あ")
        const second = word("あい", ["a", "b"])
        const forbidden = { ...word("あ"), meaning: "SEXUAL content" }
        const words = [first, second, word("あいう"), forbidden]
        const original = structuredClone(words)
        expect(filterWordPool(words)).toEqual([first, second, words[2]!])
        expect(filterWordPool(words, { selectedGroups: ["a", "b"], minLength: 1, maxLength: 2 })).toEqual([first, second])
        expect(filterWordPool(words, { selectedGroups: ["a"], minLength: 1, maxLength: 2 })).toEqual([first])
        expect(filterWordPool(words, { selectedGroups: [], minLength: 1, maxLength: 2 })).toEqual([])
        expect(words).toEqual(original)
    })
    test("combines optional dual-form words only for mixed/custom pools", () => {
        const h = word("あ"), k = word("ア"), both = word("あア")
        const data = { version: 1, hiraganaWords: [h], katakanaWords: [k], bothForms: [both] }
        expect(selectWordPool(data, "hiragana")).toEqual([h])
        expect(selectWordPool(data, "katakana")).toEqual([k])
        expect(selectWordPool(data, "both")).toEqual([h, k, both])
        expect(selectWordPool({ ...data, bothForms: undefined }, "custom")).toEqual([h, k])
    })
})
