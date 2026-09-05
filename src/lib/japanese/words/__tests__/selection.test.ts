import { afterEach, describe, expect, spyOn, test } from "bun:test"
import { getRandomWord } from "../selection"
import { wordsetAcquisition } from "../../wordsets"
import type { JapaneseWord } from "@/types/japanese"
import type { WordSets } from "@/types/api"

const restores: (() => void)[] = []
afterEach(() => { restores.splice(0).reverse().forEach(restore => restore()) })
const word = (kana: string, groups: string[], extra: Partial<JapaneseWord> = {}): JapaneseWord =>
    ({ kana, romaji: "a", type: "hiragana", groups, ...extra })
function supply(data: WordSets) {
    const load = spyOn(wordsetAcquisition, "acquire").mockResolvedValue(data)
    const device = spyOn(window, "matchMedia").mockReturnValue({ matches: false } as MediaQueryList)
    const random = spyOn(Math, "random").mockReturnValue(0)
    restores.push(() => load.mockRestore(), () => device.mockRestore(), () => random.mockRestore())
    return { load, random }
}

describe("vocabulary selection contract", () => {
    test("selects the script pool and includes bothForms in mixed/custom mode", async () => {
        const hiragana = word("あ", ["pool"])
        const katakana = word("ア", ["pool"], { type: "katakana" })
        const mixed = word("あア", ["pool"])
        const data = { version: 1, hiraganaWords: [hiragana], katakanaWords: [katakana], bothForms: [mixed] }
        const original = structuredClone(data)
        const { random } = supply(data)
        const filter = { selectedGroups: ["pool"], minLength: 1, maxLength: 2 }
        expect(await getRandomWord("hiragana", filter, "en")).toBe(hiragana)
        expect(await getRandomWord("katakana", filter, "en")).toBe(katakana)
        random.mockReturnValue(0.99)
        expect(await getRandomWord("both", filter, "en")).toBe(mixed)
        expect(await getRandomWord("custom", filter, "en")).toBe(mixed)
        expect(data).toEqual(original)
    })
    test("requires every group, includes both length bounds, and excludes blacklisted meanings", async () => {
        const first = word("ああ", ["bounds"])
        const last = word("あああ", ["bounds"])
        supply({ version: 1, hiraganaWords: [word("あ", ["bounds"]), first, last,
            word("ああああ", ["bounds"]), word("ああ", ["bounds", "outside"]),
            word("ああ", ["bounds"], { meaning: "SEXUAL material" })], katakanaWords: [] })
        const filter = { selectedGroups: ["bounds"], minLength: 2, maxLength: 3 }
        expect(await getRandomWord("hiragana", filter, "en")).toBe(first)
        const random = spyOn(Math, "random").mockReturnValue(0.99)
        try { expect(await getRandomWord("hiragana", filter, "en")).toBe(last) }
        finally { random.mockRestore() }
        expect(filter).toEqual({ selectedGroups: ["bounds"], minLength: 2, maxLength: 3 })
    })
    test("empty selected groups and pools return null", async () => {
        supply({ version: 1, hiraganaWords: [word("あ", ["empty"])], katakanaWords: [] })
        expect(await getRandomWord("hiragana", { selectedGroups: [], minLength: 7, maxLength: 8 }, "es")).toBeNull()
        expect(await getRandomWord("katakana", { selectedGroups: ["empty"], minLength: 1, maxLength: 1 }, "es")).toBeNull()
    })
    test("equivalent group order and English/Japanese reuse the same cached pool", async () => {
        const original = word("あ", ["cached-a", "cached-b"])
        const { load } = supply({ version: 1, hiraganaWords: [original], katakanaWords: [] })
        const filter = { selectedGroups: ["cached-a", "cached-b"], minLength: 1, maxLength: 1 }
        expect(await getRandomWord("hiragana", filter, "en")).toBe(original)
        load.mockResolvedValue({ version: 2, hiraganaWords: [word("い", original.groups)], katakanaWords: [] })
        expect(await getRandomWord("hiragana", { ...filter, selectedGroups: [...filter.selectedGroups].reverse() }, "ja")).toBe(original)
    })
    test("preserves original acquisition errors and legacy consent error identity", async () => {
        const { load } = supply({ version: 1, hiraganaWords: [], katakanaWords: [] })
        const offline = new Error("offline")
        load.mockRejectedValue(offline)
        await expect(getRandomWord("both")).rejects.toBe(offline)
        const consent = new Error("Wordset fetch blocked until user confirms")
        load.mockRejectedValue(consent)
        await expect(getRandomWord("both")).rejects.toBe(consent)
        expect(consent).toHaveProperty("code", "MOBILE_AUTH_REQUIRED")
    })
})
