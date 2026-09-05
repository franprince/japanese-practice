import { describe, expect, mock, test } from "bun:test"
import { ConsentRequired, WordsetAcquisition, WordsetError, normalizeLang, getWordsetCacheKey, wordsetAcquisition } from "../index"
import { validateWordset } from "../build"
import { wordsetAcquisition as ownedService } from "../acquisition"
import { recordConfirmation } from "../policy"

describe("public dataset contract", () => {
    test("runtime and build validation expose the same error identity", () => {
        expect(() => validateWordset({ version: 0 })).toThrow(WordsetError)
    })
    test("one default service provides stable normalized idle snapshots", () => {
        expect(wordsetAcquisition).toBe(ownedService)
        const service = new WordsetAcquisition({
            storage: { read: async () => null, write: async () => {}, remove: async () => {} },
            fetch, mobile: () => true, confirmation: () => {},
        })
        expect(service.state("en")).toBe(service.state("ja"))
        expect(service.state("es")).not.toBe(service.state("en"))
    })
    test("a real consent failure matches the public error class without downloading", async () => {
        const download = mock(fetch)
        const service = new WordsetAcquisition({
            storage: { read: async () => null, write: async () => {}, remove: async () => {} },
            fetch: download, mobile: () => true, confirmation: () => {},
        })
        await expect(service.acquire("ja")).rejects.toBeInstanceOf(ConsentRequired)
        expect(download).not.toHaveBeenCalled()
        expect(service.state("en")).toMatchObject({ status: "awaiting-consent", lang: "en" })
    })
    test("language, cache and confirmation keys preserve existing browser data", () => {
        expect(["en", "EN", "ja", "JA", "es", "unknown"].map(normalizeLang)).toEqual(["en", "en", "en", "en", "es", "es"])
        expect(normalizeLang()).toBe("es")
        expect(getWordsetCacheKey("ja")).toBe("prod-en")
        const key = "wordset-confirmed-en"
        const saved = localStorage.getItem(key)
        try {
            recordConfirmation("ja", true)
            expect(localStorage.getItem(key)).toBe("1")
            recordConfirmation("en", false)
            expect(localStorage.getItem(key)).toBeNull()
        } finally {
            if (saved === null) localStorage.removeItem(key)
            else localStorage.setItem(key, saved)
        }
    })
})
