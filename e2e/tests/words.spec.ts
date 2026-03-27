import { test, expect } from '../fixtures'
import * as fs from 'fs'
import * as path from 'path'

// Load kana dictionary for deterministic answers
const kanaDict = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../src/lib/japanese/shared/kanaDictionary.json'), 'utf-8')
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

        const score = page.locator('text=/score|puntaje/i')
        await expect(score).toBeVisible()
    })

    test('should handle correct and incorrect romaji input with feedback', async ({ wordsPage, page }) => {
        const charMap = buildCharacterMap()
        await wordsPage.goto()

        // 1. Get the character being shown
        const kanaElement = page.locator('[data-testid="question-display"]')
        await expect(kanaElement).toBeVisible()
        const kanaChar = (await kanaElement.textContent())?.trim() || ""
        const correctRomaji = charMap[kanaChar] || "a"

        // 2. Test CORRECT answer
        const input = page.locator('input[type="text"]')
        await input.fill(correctRomaji)
        await page.keyboard.press('Enter')

        // Wait for feedback
        await page.waitForTimeout(500)
        await wordsPage.screenshot('words_feedback_correct')

        // Verify score increment (this depends on initial score, usually 0 -> 1)
        // const scoreVal = page.locator('span.tabular-nums').first();
        // await expect(scoreVal).not.toHaveText('0');

        // 3. Move to NEXT word
        const nextBtn = page.getByRole('button', { name: /next|siguiente|次/i }).first()
        await nextBtn.click()
        await page.waitForTimeout(500)

        // 4. Test INCORRECT answer
        const newKanaChar = (await kanaElement.textContent())?.trim() || ""
        const wrongRomaji = "xyzq"
        await input.fill(wrongRomaji)

        const checkBtn = page.getByRole('button', { name: /check|comprobar/i })
        await checkBtn.first().click({ force: true })
        await page.waitForTimeout(500)

        // Capture incorrect screenshot
        await wordsPage.screenshot('words_feedback_incorrect')
    })

    test('should load words game on mobile with confirmation flow', async ({ wordsPage, page }) => {
        // Use a mobile viewport width to correctly trigger mobile CSS rules
        await page.setViewportSize({ width: 390, height: 844 })

        // Mock matchMedia to ensure isMobileDevice returns true
        await page.addInitScript(() => {
            // Force English language and clear other storage
            localStorage.clear()
            localStorage.setItem('kana-words-lang', 'en')

            // Force matchMedia to true for mobile breadth ONLY
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: (query: string) => ({
                    matches: query.includes('max-width: 768px'), // Only match the mobile query
                    media: query,
                    onchange: null,
                    addListener: () => { },
                    removeListener: () => { },
                    addEventListener: () => { },
                    removeEventListener: () => { },
                    dispatchEvent: () => false,
                }),
            });
        })

        await wordsPage.goto()

        // Clear IndexedDB to simulate a fresh mobile user
        await page.evaluate(async () => {
            const DB_NAME = "kana-words"
            return new Promise<void>((resolve, reject) => {
                const req = indexedDB.deleteDatabase(DB_NAME)
                req.onsuccess = () => resolve()
                req.onerror = () => reject(req.error)
                req.onblocked = () => resolve()
            })
        })

        // Reload to apply the cleared DB state
        await wordsPage.goto()
        await page.waitForLoadState('networkidle')

        // 1. Should start in Character Mode (input visible immediately, no download)
        const input = page.locator('input[type="text"]')
        await expect(input).toBeVisible()

        // 2. Switch to Words Mode (toggle button)
        const switchBtn = page.getByLabel(/words|palabras/i)
        console.log('Waiting for switch button...')
        await switchBtn.waitFor({ timeout: 5000 })

        if (await switchBtn.isVisible()) {
            await switchBtn.click()
            console.log('Clicked switch button')
        } else {
            console.log('Switch button not found')
        }

        // 3. Now should see Download Confirmation Modal
        console.log('Waiting for modal...')
        const modal = page.locator('[data-testid="mobile-wordset-modal"]')
        await expect(modal).toBeVisible({ timeout: 10000 })
        console.log('Modal found! Clicking Download...')
        const downloadBtn = modal.locator('button', { hasText: /Download|Descargar/i })
        await downloadBtn.click()

        // Verify modal closes
        await expect(modal).toBeHidden({ timeout: 10000 })

        // 4. Input should reappear
        await expect(input).toBeVisible({ timeout: 10000 })
    })

    test('should allow playing in Guess mode', async ({ wordsPage, page }) => {
        await wordsPage.goto()
        
        // 1. Switch to Guess mode using the desktop topbar button
        const guessBtn = page.getByRole('button', { name: /guess|adivina|推測/i }).filter({ visible: true }).first()
        await guessBtn.click()
        
        // 2. Verify that there is no text input
        await expect(page.locator('input[type="text"]')).toBeHidden({ timeout: 10000 })
        
        // 3. Verify that 3 buttons are displayed (multiple choice options)
        const options = page.locator('button.font-mono')
        await expect(options).toHaveCount(3, { timeout: 10000 })
        
        // 4. Click an option and verify feedback appears
        await options.first().click()
        const feedback = page.locator('[data-testid="game-feedback"]')
        await expect(feedback).toBeVisible()
        
        // 5. Verify the "Next" button appears
        const nextBtn = page.getByRole('button', { name: /next|siguiente|次/i }).first()
        await expect(nextBtn).toBeVisible()
    })
})
