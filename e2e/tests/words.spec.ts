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

        const checkBtn = page.locator('button:has-text("Check"), button:has-text("Verificar"), button:has-text("Comprobar")')
        expect(await checkBtn.count()).toBeGreaterThan(0)

        const stats = page.locator('[data-testid="stats-display"]')
        await expect(stats).toBeVisible()

        const modeButtons = page.locator('button').filter({ hasText: /hiragana|katakana|ambos|both/i })
        expect(await modeButtons.count()).toBeGreaterThan(0)
    })

    test('should capture correct answer feedback', async ({ wordsPage, page }) => {
        await page.setViewportSize({ width: 1280, height: 720 })
        await wordsPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        const input = page.locator('input[type="text"]')
        const checkBtn = page.locator('button:has-text("Check"), button:has-text("Verificar"), button:has-text("Comprobar")')

        // Get the displayed kana using the question-display test ID
        const displayedKana = await page.locator('[data-testid="question-display"]').textContent()

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

    test('should load words game on mobile with confirmation flow', async ({ wordsPage, page }) => {
        // Use desktop viewport but simulate mobile logic via matchMedia override
        await page.setViewportSize({ width: 1280, height: 800 })

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
        const switchBtn = page.getByRole('button', { name: /switch to|cambiar a/i })
        console.log('Waiting for switch button...')
        await switchBtn.waitFor({ timeout: 5000 })

        if (await switchBtn.isVisible()) {
            await switchBtn.click()
            console.log('Clicked switch button')
        } else {
            console.log('Switch button not found, checking if already in words mode...')
            // If we are already in words mode, the button should say "Switch to Characters"
            const charBtn = page.locator('button[title*="Switch to"], button[title*="Cambiar a"]')
            if (await charBtn.isVisible()) {
                console.log('Already in Words Mode (Switch to Characters visible)')
            } else {
                console.log('NEITHER button found. Dumping page layout...')
            }
        }

        // 3. Now should see Download Confirmation Modal
        console.log('Waiting for modal...')
        const modal = page.locator('[data-testid="mobile-wordset-modal"]')
        await expect(modal).toBeVisible({ timeout: 5000 })
        console.log('Modal found! Clicking Download...')
        const downloadBtn = modal.locator('button', { hasText: /Download|Descargar/i })
        await downloadBtn.click()

        // Verify modal closes
        await expect(modal).toBeHidden({ timeout: 5000 })

        // 4. Input should reappear
        try {
            await expect(input).toBeVisible({ timeout: 10000 })
        } catch (e) {
            console.log('Input not visible after download. Checking for error state...')
            const noWords = page.locator('text=/No words|No hay palabras/i')
            if (await noWords.isVisible()) {
                console.log('Error: "No words" message is visible!')
            } else {
                console.log('Error: Input missing AND "No words" missing. Dumping layout...')
                const content = await page.content()
                fs.writeFileSync('page_dump_fail.html', content)
            }
            throw e
        }
    })

})
