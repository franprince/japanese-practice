import { fixtureManifest } from "../../src/test/wordset-fixture"
import { test, expect } from '../fixtures'

test.describe('Words Game', () => {
    test('should load the words game page and capture initial state', async ({ wordsPage, page }) => {
        await wordsPage.goto()
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveURL('/words')
        await wordsPage.screenshot('words_initial_load')
    })

    test('should display all UI components', async ({ wordsPage, page }) => {
        await wordsPage.goto()
        await page.waitForLoadState('networkidle')
        
        // Settings button should be visible (either in header or controls)
        const settingsBtn = page.getByTestId('settings-trigger').filter({ visible: true })
        await expect(settingsBtn).toBeVisible({ timeout: 15000 })

        // Score HUD should be visible
        const stats = page.getByTestId('stats-display')
        await expect(stats).toBeVisible({ timeout: 10000 })
        
        // Use a more specific locator for Score text within the Stats display
        await expect(stats.locator('text=/score|puntaje/i').first()).toBeVisible()
    })

    test('should handle correct and incorrect romaji input with feedback', async ({ wordsPage, page }) => {
        const data = {
            version: 1,
            hiraganaWords: [{ kana: 'あいう', romaji: 'aiu', type: 'hiragana', groups: ['h1'] }],
            katakanaWords: [],
        }
        await page.route('**/wordsets/manifest.json', route => route.fulfill({ json: fixtureManifest(data) }))
        await page.route('**/wordsets/*-*.json', route => route.fulfill({ json: data }))
        await wordsPage.goto()

        // 1. Get the character being shown
        const kanaElement = page.locator('[data-testid="question-display"]')
        await expect(kanaElement).toBeVisible()
        await expect(kanaElement).toHaveText('あいう')
        const correctRomaji = 'aiu'

        // 2. Test CORRECT answer
        const input = page.locator('input[type="text"]')
        await input.fill(correctRomaji)
        await page.keyboard.press('Enter')

        // Wait for feedback
        await expect(input).toHaveClass(/border-success/)
        await expect(input).toHaveAttribute('readonly', '')
        await wordsPage.screenshot('words_feedback_correct')

        // 3. Move to NEXT word
        const nextBtn = page.getByRole('button', { name: /^(next word|siguiente palabra|次)/i }).first()
        await nextBtn.click()
        await expect(nextBtn).not.toBeVisible()

        // 4. Test INCORRECT answer
        const wrongRomaji = "xyzq"
        await input.fill(wrongRomaji)

        const checkBtn = page.getByRole('button', { name: /check|comprobar/i }).first()
        await checkBtn.click({ force: true })
        
        // Wait for incorrect feedback
        await expect(input).toHaveClass(/border-destructive/)
        await expect(input).toHaveAttribute('readonly', '')

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

        // Open settings to enable Words mode (default)
        await page.getByRole('button', { name: 'Command Center', exact: true }).click()
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
        
        const wordsBtn = page.getByRole('button', { name: 'Words Vocabulary practice', exact: true })
        await wordsBtn.click()

        const applyBtn = page.getByRole('button', { name: /apply|save|aplicar/i }).first()
        await applyBtn.click()

        // 3. Now should see Download Confirmation Modal
        console.log('Waiting for modal...')
        const modal = page.locator('[data-testid="mobile-wordset-modal"]')
        await expect(modal).toBeVisible({ timeout: 10000 })
        const downloadBtn = modal.locator('button', { hasText: /Download|Descargar/i })
        await downloadBtn.click()

        // Verify modal closes
        await expect(modal).toBeHidden({ timeout: 10000 })

        // 4. Input should reappear
        await expect(input).toBeVisible({ timeout: 10000 })
    })

    test('should allow playing in Guess mode', async ({ wordsPage, page }) => {
        await wordsPage.goto()
        
        // 1. Open Settings
        await page.getByTestId('settings-trigger').filter({ visible: true }).click()
        const modal = page.getByRole('dialog')
        await expect(modal).toBeVisible()
        
        // 2. Switch to Guess mode
        const guessBtn = page.getByRole('button', { name: /guess|adivina/i }).first()
        await guessBtn.click()
        // 3. Apply
        const applyBtn = page.getByRole('button', { name: /apply|save|aplicar|guardar/i }).first()
        await applyBtn.click({ force: true })
        await expect(modal).not.toBeVisible({ timeout: 15000 })
        
        // 3. Verify that there is no text input
        await expect(page.locator('input[type="text"]')).toBeHidden({ timeout: 10000 })
        
        // 4. Verify that 3 buttons are displayed (multiple choice options)
        const options = page.getByTestId('guess-option')
        await expect(options).toHaveCount(3, { timeout: 10000 })
        
        // 5. Click an option and verify feedback appears
        await options.first().click()
        await expect(options.first()).toBeDisabled()
        
        // 6. Verify the "Next" button appears
        const nextBtn = page.getByRole('button', { name: /^(next word|siguiente palabra|次)/i }).first()
        await expect(nextBtn).toBeVisible()
    })
})
