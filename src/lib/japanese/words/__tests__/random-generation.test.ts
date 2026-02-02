import { describe, expect, it } from "bun:test"
import { getRandomCharacter, kanaToRomaji } from "../words"

describe("Random Generation Logic", () => {
    it("should generate consistency between kana and romaji", async () => {
        for (let i = 0; i < 100; i++) {
            // Pass minimal filter, let it use default groups
            const result = await getRandomCharacter("katakana", {
                minLength: 3,
                maxLength: 5,
            } as any)

            if (result) {
                const calculatedRomaji = kanaToRomaji(result.kana)
                expect(result.romaji).toBe(calculatedRomaji)
            }
        }
    })

    it("should not generate consecutive chouonpu (ーー)", async () => {
        for (let i = 0; i < 200; i++) {
            const result = await getRandomCharacter("katakana", {
                minLength: 5,
                maxLength: 8
            } as any)

            if (result) {
                expect(result.kana).not.toContain("ーー")
            }
        }
    })

    it("should handle chouonpu correctly in generated words", async () => {
        let chouonpuCount = 0
        let successCount = 0
        for (let i = 0; i < 1000; i++) {
            const result = await getRandomCharacter("katakana", {
                minLength: 4,
                maxLength: 6
            } as any)

            if (result) {
                successCount++
                if (result.kana.includes("ー")) {
                    chouonpuCount++
                    // Verify that the Romaji contains a macron
                    expect(/[āīūēōĀĪŪĒŌ]/.test(result.romaji)).toBe(true)
                }
            }
        }

        expect(successCount).toBeGreaterThan(0)
        // With 15% chance per eligible char, we should see some chouonpu in 1000 tries
        console.log(`Generated ${chouonpuCount} words with chouonpu out of ${successCount} generated words`)
        expect(chouonpuCount).toBeGreaterThan(0)
    })
})
