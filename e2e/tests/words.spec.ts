import { test, expect } from '../fixtures'
import * as fs from 'fs'
import * as path from 'path'

// Load kana dictionary for deterministic answers
const kanaDict = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../src/lib/data/kanaDictionary.json'), 'utf-8')
)

// Build a lookup map for quick character->romaji conversion
function buildCharacterMap() {
    const map: Record<string, string> = {}

    // Add hiragana
    for (const group of Object.values(kanaDict.hiragana)) {
        const chars = (group as any).characters
        if (chars) {
            for (const [kana, romaji] of Object.entries(chars)) {
                const firstRomaji = (romaji as string[])[0]
                if (firstRomaji) {
                    map[kana] = firstRomaji
                }
            }
        }
    }

    // Add katakana
    for (const group of Object.values(kanaDict.katakana)) {
        const chars = (group as any).characters
        if (chars) {
            for (const [kana, romaji] of Object.entries(chars)) {
                const firstRomaji = (romaji as string[])[0]
                if (firstRomaji) {
                    map[kana] = firstRomaji
                }
            }
        }
    }

    return map
}

test.describe('Words Game', () => {
    test('should load the words game page and capture initial state', async ({ wordsPage, page }) => {
        await wordsPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        await expect(page).toHaveURL('/words')
        await wordsPage.screenshot('words_initial_load')
    })

    test('should display all UI components', async ({ wordsPage, page }) => {
        await wordsPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500)

        const input = page.locator('input[type="text"]')
        await expect(input).toBeVisible()

        const checkBtn = page.locator('button:has-text("Check"), button:has-text("Verificar"), button:has-text("Comprobar")')
        expect(await checkBtn.count()).toBeGreaterThan(0)

        const stats = page.locator('[data-testid="stats-display"]')
        await expect(stats).toBeVisible()

        const modeButtons = page.locator('button').filter({ hasText: /hiragana|katakana|ambos|both/i })
        expect(await modeButtons.count()).toBeGreaterThan(0)
    })

    test('should capture correct answer feedback', async ({ wordsPage, page }) => {
        await wordsPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        const input = page.locator('input[type="text"]')
        const checkBtn = page.locator('button:has-text("Check"), button:has-text("Verificar"), button:has-text("Comprobar")')

        // Get the displayed kana using the word-question ID
        const displayedKana = await page.locator('#word-question').textContent()

        if (!displayedKana) {
            throw new Error('Could not find displayed kana')
        }

        // Build character map and convert kana to romaji
        const charMap = buildCharacterMap()
        let correctAnswer = ''
        for (const char of displayedKana) {
            if (charMap[char]) {
                correctAnswer += charMap[char]
            }
        }

        // Type the correct answer
        await input.click()
        await input.fill(correctAnswer)
        await page.waitForTimeout(500)

        // Click check
        await checkBtn.first().click({ force: true })
        await page.waitForTimeout(2000)

        // Capture success screenshot
        await wordsPage.screenshot('words_feedback_correct')
    })

    test('should capture incorrect answer feedback', async ({ wordsPage, page }) => {
        await wordsPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        const input = page.locator('input[type="text"]')
        const checkBtn = page.locator('button:has-text("Check"), button:has-text("Verificar"), button:has-text("Comprobar")')

        // Type an incorrect answer
        await input.click()
        await input.fill('wronganswer')
        await page.waitForTimeout(500)

        // Click check
        await checkBtn.first().click({ force: true })
        await page.waitForTimeout(2000)

        // Capture incorrect screenshot
        await wordsPage.screenshot('words_feedback_incorrect')
    })

})
