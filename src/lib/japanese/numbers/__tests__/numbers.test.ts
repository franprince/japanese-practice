import { describe, expect, it } from "bun:test"
import { arabicToJapanese, japaneseToArabic } from "../numbers"

describe("japaneseToArabic", () => {
    it("round-trips every generated practice numeral", () => {
        for (let value = 1; value <= 99999; value++) {
            expect(japaneseToArabic(arabicToJapanese(value))).toBe(value)
        }
    })

    it.each([
        ["〇", 0], ["零", 0], ["十", 10], ["一十", 10],
        ["百", 100], ["一百", 100], ["千", 1000], ["一千", 1000],
        ["万", 10000], ["一万", 10000], ["二万三千四百五十六", 23456],
        ["一万一千一百一十一", 11111], ["一万三", 10003], ["十万", 100000],
    ])("accepts valid unit notation %s", (input, expected) => {
        expect(japaneseToArabic(input)).toBe(expected)
    })

    it.each([
        "", "一二", "九一", "十十", "百百", "十百", "百千", "千十百",
        "二千一千", "万万", "一万一万", "〇十", "零百", "一〇", "零一",
        "一万〇一", "一百二三", "abc", "一a", "一 二", "-一",
    ])("rejects malformed or unknown notation %s", input => {
        expect(japaneseToArabic(input)).toBe(-1)
    })
})
