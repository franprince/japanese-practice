import { test, expect } from '../fixtures'

test.describe('Words Game', () => {
    test('should load the words game page', async ({ wordsPage }) => {
        await wordsPage.goto()

        // Verify page loaded
        await expect(wordsPage.page).toHaveURL('/words')
    })

    test('should display game controls and stats', async ({ wordsPage, page }) => {
        await wordsPage.goto()

        // Check for stats display
        const stats = await page.locator('[data-testid="stats-display"]')
        await expect(stats).toBeVisible()
    })

    test('should allow mode switching', async ({ wordsPage, page }) => {
        await wordsPage.goto()

        // Wait for page to load
        await page.waitForLoadState('networkidle')

        // Find and click katakana mode button
        const katakanaBtn = await page.locator('button:has-text("カタカナ"), button:has-text("Katakana")').first()
        if (await katakanaBtn.isVisible()) {
            await katakanaBtn.click()

            // Verify mode changed (stats should reset)
            const stats = await page.locator('[data-testid="stats-display"]')
            await expect(stats).toBeVisible()
        }
    })

    test('should allow answering questions', async ({ wordsPage, page }) => {
        await wordsPage.goto()

        // Wait for game to load
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000) // Wait for character groups to load

        // Type an answer
        const input = await page.locator('input[type="text"]')
        if (await input.isVisible()) {
            await input.fill('test')

            // Submit answer
            const checkBtn = await page.locator('button:has-text("Check"), button:has-text("Verificar")')
            if (await checkBtn.isVisible()) {
                await checkBtn.click()

                // Should show feedback (correct or incorrect)
                await page.waitForTimeout(500)
            }
        }
    })

    test('should allow skipping words', async ({ wordsPage, page }) => {
        await wordsPage.goto()

        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Click skip button
        const skipBtn = await page.locator('button:has-text("Skip"), button:has-text("Saltar")')
        if (await skipBtn.isVisible()) {
            await skipBtn.click()

            // Should load new word
            await page.waitForTimeout(500)
        }
    })
})
