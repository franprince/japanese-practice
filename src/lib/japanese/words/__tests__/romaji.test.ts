import { beforeAll, describe, expect, test } from "bun:test"
import { convertKanaToRomaji, kanaToRomaji } from "../romaji"
import { getKanaRomajiMap } from "../../shared/kana-dictionary-loader"

beforeAll(() => getKanaRomajiMap())
describe("kana conversion contract", () => {
    test("a missing synchronous dictionary retains empty output without initializing data", () => {
        const map = {}
        expect(convertKanaToRomaji("あっきゃー", map)).toBe("")
        expect(map).toEqual({})
    })
    test.each([
        ["きゃ", "kya"], ["キャ", "kya"], ["がっこう", "gakkō"],
        ["カップ", "kappu"], ["コーヒー", "kōhī"], ["おう", "ō"],
        ["ああいい", "āī"], ["あーー", "ā"], ["", ""], ["?", ""],
        ["っ", ""], ["ー", ""], ["あ?い", "ai"],
    ])("converts %s without changing established spelling", (kana, expected) => {
        expect(kanaToRomaji(kana)).toBe(expected)
    })
})
