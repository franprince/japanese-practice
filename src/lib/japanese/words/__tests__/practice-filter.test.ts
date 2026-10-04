import { describe, expect, test } from "bun:test"
import { resolvePracticeFilter } from "../filtering"
import type { CharacterGroup } from "@/types/japanese"

const groups: CharacterGroup[] = [
    { id: "h1", type: "hiragana", characters: ["あ"], label: "a", labelJp: "あ" },
    { id: "k1", type: "katakana", characters: ["ア"], label: "a", labelJp: "ア" },
]
const customFilter = { selectedGroups: ["h1"], minLength: 10, maxLength: 10 }

describe("active Words practice filters", () => {
    test.each([
        ["hiragana", ["h1"]], ["katakana", ["k1"]], ["both", ["h1", "k1"]],
    ] as const)("%s ignores hidden Custom groups and length", (mode, selectedGroups) => {
        const original = structuredClone({ groups, customFilter })
        expect(resolvePracticeFilter(mode, customFilter, groups)).toEqual({ selectedGroups: [...selectedGroups], minLength: 3, maxLength: 6 })
        expect({ groups, customFilter }).toEqual(original)
    })
    test("Custom restores its saved filter without changing the editing draft", () => {
        resolvePracticeFilter("katakana", customFilter, groups)
        expect(resolvePracticeFilter("custom", customFilter, groups)).toBe(customFilter)
    })
})
