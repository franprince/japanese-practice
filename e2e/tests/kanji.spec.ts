import { test, expect } from '../fixtures'
import * as fs from 'fs'
import * as path from 'path'

// Load kanji set for deterministic answers
const kanjiSet = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../public/kanjiset-v1.json'), 'utf-8')
)

// Helper to find kanji data by character
function findKanjiData(char: string) {
    return kanjiSet.find((k: any) => k.char === char)
}

test.describe('Kanji Game', () => {
    test('should load the kanji game page and capture initial state', async ({ kanjiPage, page }) => {
        await kanjiPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        await expect(page).toHaveURL('/kanji')
        await kanjiPage.screenshot('kanji_initial_load')
    })

    test('should display all UI components', async ({ kanjiPage, page }) => {
        await kanjiPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500)

        // Verify stats display
        const stats = page.locator('[data-testid="stats-display"]')
        await expect(stats).toBeVisible()

        // Verify difficulty selector buttons
        const easyBtn = page.locator('button:has-text("Easy"), button:has-text("Fácil")')
        const mediumBtn = page.locator('button:has-text("Medium"), button:has-text("Medio")')
        const hardBtn = page.locator('button:has-text("Hard"), button:has-text("Difícil")')

        expect(await easyBtn.count()).toBeGreaterThan(0)
        expect(await mediumBtn.count()).toBeGreaterThan(0)
        expect(await hardBtn.count()).toBeGreaterThan(0)

        // Verify kanji character is displayed
        const kanjiDisplay = page.locator('.text-7xl, .text-9xl').first()
        await expect(kanjiDisplay).toBeVisible()

        // Verify options container
        const optionsContainer = page.locator('#kanji-options')
        await expect(optionsContainer).toBeVisible()

        // Verify option cards are displayed (should be 4)
        const options = page.locator('#kanji-options button')
        expect(await options.count()).toBeGreaterThanOrEqual(3)
    })

    test('should allow difficulty selection and show different hints', async ({ kanjiPage, page }) => {
        await kanjiPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500)

        // Test Easy difficulty (shows meaning + reading)
        const easyBtn = page.locator('button:has-text("Easy"), button:has-text("Fácil")').first()
        await easyBtn.click()
        await page.waitForTimeout(1000)
        await kanjiPage.screenshot('kanji_difficulty_easy')

        // Test Medium difficulty (shows meaning only)
        const mediumBtn = page.locator('button:has-text("Medium"), button:has-text("Medio")').first()
        await mediumBtn.click()
        await page.waitForTimeout(1000)
        await kanjiPage.screenshot('kanji_difficulty_medium')

        // Test Hard difficulty (shows reading only)
        const hardBtn = page.locator('button:has-text("Hard"), button:has-text("Difícil")').first()
        await hardBtn.click()
        await page.waitForTimeout(1000)
        await kanjiPage.screenshot('kanji_difficulty_hard')
    })

    test('should capture correct answer feedback', async ({ kanjiPage, page }) => {
        await kanjiPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        // Get the displayed kanji character
        const kanjiDisplay = page.locator('.text-7xl, .text-9xl').first()
        const displayedKanji = await kanjiDisplay.textContent()

        if (!displayedKanji) {
            throw new Error('Could not find displayed kanji')
        }

        // Find the kanji data
        const kanjiData = findKanjiData(displayedKanji.trim())
        if (!kanjiData) {
            throw new Error(`Could not find data for kanji: ${displayedKanji}`)
        }

        // Find and click the correct option
        // The correct option will contain either the meaning or reading depending on difficulty
        const options = page.locator('#kanji-options button')
        const optionCount = await options.count()

        let correctOptionClicked = false
        for (let i = 0; i < optionCount; i++) {
            const optionText = await options.nth(i).textContent()
            if (optionText && (
                optionText.toLowerCase().includes(kanjiData.meaning_en?.toLowerCase() || '') ||
                optionText.toLowerCase().includes(kanjiData.meaning_es?.toLowerCase() || '') ||
                optionText.includes(kanjiData.reading || '')
            )) {
                await options.nth(i).click()
                correctOptionClicked = true
                break
            }
        }

        if (!correctOptionClicked) {
            throw new Error('Could not find correct option to click')
        }

        await page.waitForTimeout(1000)

        // Verify success feedback - ResultDisplay uses bg-green-500/10 border-green-500/30
        const successFeedback = page.locator('.bg-green-500\\/10.border-green-500\\/30').first()
        await expect(successFeedback).toBeVisible()

        // Capture screenshot
        await kanjiPage.screenshot('kanji_feedback_correct')
    })

    test('should capture incorrect answer feedback', async ({ kanjiPage, page }) => {
        await kanjiPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        // Get the displayed kanji character
        const kanjiDisplay = page.locator('.text-7xl, .text-9xl').first()
        const displayedKanji = await kanjiDisplay.textContent()

        if (!displayedKanji) {
            throw new Error('Could not find displayed kanji')
        }

        // Find the kanji data
        const kanjiData = findKanjiData(displayedKanji.trim())
        if (!kanjiData) {
            throw new Error(`Could not find data for kanji: ${displayedKanji}`)
        }

        // Find and click an incorrect option
        const options = page.locator('#kanji-options button')
        const optionCount = await options.count()

        let incorrectOptionClicked = false
        for (let i = 0; i < optionCount; i++) {
            const optionText = await options.nth(i).textContent()
            if (optionText && !(
                optionText.toLowerCase().includes(kanjiData.meaning_en?.toLowerCase() || '') ||
                optionText.toLowerCase().includes(kanjiData.meaning_es?.toLowerCase() || '') ||
                optionText.includes(kanjiData.reading || '')
            )) {
                await options.nth(i).click()
                incorrectOptionClicked = true
                break
            }
        }

        if (!incorrectOptionClicked) {
            throw new Error('Could not find incorrect option to click')
        }

        await page.waitForTimeout(1000)

        // Verify error feedback - ResultDisplay uses bg-red-500/10 border-red-500/30
        const errorFeedback = page.locator('.bg-red-500\\/10.border-red-500\\/30').first()
        await expect(errorFeedback).toBeVisible()

        // Capture screenshot
        await kanjiPage.screenshot('kanji_feedback_incorrect')
    })

    test('should allow keyboard navigation with Enter key', async ({ kanjiPage, page }) => {
        await kanjiPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        // Click any option to answer
        const options = page.locator('#kanji-options button')
        await options.first().click()
        await page.waitForTimeout(1000)

        // Verify Next button appears
        const nextBtn = page.locator('button:has-text("Next"), button:has-text("Siguiente")')
        await expect(nextBtn.first()).toBeVisible()

        // Get current kanji
        const kanjiDisplay = page.locator('.text-7xl, .text-9xl').first()
        const currentKanji = await kanjiDisplay.textContent()

        // Press Enter
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1000)

        // Verify new kanji loaded
        const newKanji = await kanjiDisplay.textContent()
        expect(newKanji).not.toBe(currentKanji)
    })

    test('should open and close settings popover', async ({ kanjiPage, page }) => {
        await kanjiPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500)

        // Find and click settings button
        const settingsBtn = page.locator('button[aria-label*="Settings"], button[aria-label*="Configuración"]').first()
        if (await settingsBtn.isVisible()) {
            await settingsBtn.click()
            await page.waitForTimeout(500)

            // Verify popover content is visible
            const popoverContent = page.locator('[role="dialog"], .popover-content').first()
            if (await popoverContent.isVisible()) {
                // Close popover by clicking outside or pressing Escape
                await page.keyboard.press('Escape')
                await page.waitForTimeout(500)
            }
        }
    })

    test('should complete session mode and show summary', async ({ kanjiPage, page }) => {
        await kanjiPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500)

        // Open settings popover - use simpler selector for the settings icon button
        const settingsBtn = page.getByRole('button').filter({ has: page.locator('svg') }).first()
        await settingsBtn.click()
        await page.waitForTimeout(500)

        // Select session mode
        const sessionBtn = page.locator('button:has-text("Session"), button:has-text("Sesión")').first()
        await sessionBtn.click()
        await page.waitForTimeout(300)

        // Set count to 5
        const count5Btn = page.locator('button:has-text("5")').first()
        await count5Btn.click()
        await page.waitForTimeout(300)

        // Close popover by clicking backdrop
        await page.locator('.fixed.inset-0').click()
        await page.waitForTimeout(500)

        // Answer 5 questions
        for (let i = 0; i < 5; i++) {
            await page.waitForTimeout(1000)

            // Click any option to answer
            const options = page.locator('#kanji-options button')
            await options.first().click()
            await page.waitForTimeout(1000)

            // Click next button to proceed (skip if disabled - happens on last question in session mode)
            const nextBtn = page.locator('button:has-text("Next"), button:has-text("Siguiente"), button:has-text("Próximo")').first()
            if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
                await nextBtn.click()
                await page.waitForTimeout(1000)
            }
        }

        // Wait for session summary to appear
        await page.waitForTimeout(2000)

        // Verify and capture session summary
        const summaryCard = page.locator('text=/Session complete|Sesión completada/i, text=/Restart|Reiniciar/i').first()
        await expect(summaryCard).toBeVisible({ timeout: 5000 })

        await kanjiPage.screenshot('kanji_session_complete')
    })
})
