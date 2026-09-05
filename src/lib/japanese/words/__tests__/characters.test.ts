import { describe, expect, spyOn, test } from "bun:test"
import { generateCharacters, getRandomCharacter } from "../characters"
import { getCharacterGroups } from "../../shared/kana-dictionary-loader"
import * as dictionary from "../../shared/kana-dictionary-loader"
import type { CharacterGroup } from "@/types/japanese"

describe("character generation contract", () => {
    test("does not generate until both deferred dictionary groups and romaji map are ready", async () => {
        let resolveGroups!: (groups: CharacterGroup[]) => void
        let resolveMap!: (map: Record<string, string>) => void
        const groups = spyOn(dictionary, "getCharacterGroups").mockImplementation(() => new Promise(resolve => { resolveGroups = resolve }))
        const map = spyOn(dictionary, "getKanaRomajiMap").mockImplementation(() => new Promise(resolve => { resolveMap = resolve }))
        const random = spyOn(Math, "random").mockReturnValue(0)
        try {
            let settled = false
            const pending = getRandomCharacter("hiragana").then(result => { settled = true; return result })
            expect(map).not.toHaveBeenCalled()
            resolveGroups([{ id: "deferred", type: "hiragana", characters: ["あ"], label: "a", labelJp: "あ" }])
            await Promise.resolve()
            expect(map).toHaveBeenCalledTimes(1)
            expect(settled).toBe(false)
            resolveMap({ "あ": "a" })
            expect(await pending).toEqual({ kana: "あ", romaji: "a", type: "hiragana", groups: ["deferred"] })
        } finally { groups.mockRestore(); map.mockRestore(); random.mockRestore() }
    })
    test("awaits the dictionary and honors exact length, script and distinct group metadata", async () => {
        const groups = await getCharacterGroups()
        const vowels = groups.find(group => group.type === "katakana" && group.characters[0] === "ア")!
        const filter = { selectedGroups: [vowels.id], minLength: 3, maxLength: 3 }
        const original = structuredClone(filter)
        const random = spyOn(Math, "random").mockReturnValue(0)
        try {
            expect(await getRandomCharacter("both", filter)).toEqual({ kana: "アアア", romaji: "aaa", type: "katakana", groups: [vowels.id] })
            expect(filter).toEqual(original)
        } finally { random.mockRestore() }
    })
    test("returns null for empty or unavailable selected groups", async () => {
        for (const selectedGroups of [[], ["missing-character-group"]]) {
            expect(await getRandomCharacter("hiragana", { selectedGroups, minLength: 1, maxLength: 1 })).toBeNull()
        }
    })
    test("unfiltered single-script generation returns a playable character", async () => {
        const random = spyOn(Math, "random").mockReturnValue(0)
        try {
            expect(await getRandomCharacter("hiragana")).toMatchObject({ kana: "あ", romaji: "a", type: "hiragana" })
        } finally { random.mockRestore() }
    })
    test("mixed generation preserves chosen script order and deduplicates used groups", () => {
        const groups: CharacterGroup[] = [
            { id: "h1", type: "hiragana", characters: ["あ"], label: "a", labelJp: "あ" },
            { id: "k1", type: "katakana", characters: ["ア"], label: "a", labelJp: "ア" },
        ]
        const filter = { selectedGroups: ["h1", "k1"], minLength: 3, maxLength: 3 }
        const sequence = [0, 0, 0, 0, 0.99, 0, 0, 0]
        let index = 0
        const original = structuredClone({ groups, filter })
        expect(generateCharacters("both", filter, groups, { "あ": "a", "ア": "a" }, () => sequence[index++]!))
            .toEqual({ kana: "あアあ", romaji: "aaa", type: "hiragana", groups: ["h1", "k1"] })
        expect({ groups, filter }).toEqual(original)
    })
    test("special groups retain the forty-percent inclusion threshold", () => {
        const group: CharacterGroup = { id: "h16_a", type: "hiragana", characters: ["きゃ"], label: "kya", labelJp: "きゃ" }
        const filter = { selectedGroups: [group.id], minLength: 1, maxLength: 1 }
        expect(generateCharacters("hiragana", filter, [group], { "きゃ": "kya" }, () => 0.39))
            .toEqual({ kana: "きゃ", romaji: "kya", type: "hiragana", groups: [group.id] })
        expect(generateCharacters("hiragana", filter, [group], { "きゃ": "kya" }, () => 0.4)).toBeNull()
        const largerPool = [group, { ...group, id: "h1" }, { ...group, id: "h2" }]
        expect(generateCharacters("hiragana", filter, largerPool, { "きゃ": "kya" }, () => 0.99)?.kana).toBe("きゃ")
    })
})
