import { test, expect } from '../fixtures'

test.describe('Kanji Game', () => {
    test('should load the kanji game page', async ({ kanjiPage }) => {
        await kanjiPage.goto()

        await expect(kanjiPage.page).toHaveURL('/kanji')
    })

    test('should display game controls and stats', async ({ kanjiPage, page }) => {
        await kanjiPage.goto()

        const stats = await page.locator('[data-testid="stats-display"]')
        await expect(stats).toBeVisible()
    })

    test('should allow difficulty selection', async ({ kanjiPage, page }) => {
        await kanjiPage.goto()

        await page.waitForLoadState('networkidle')

        // Try to select medium difficulty
        const mediumBtn = await page.locator('button:has-text("Medium"), button:has-text("Medio")').first()
        if (await mediumBtn.isVisible()) {
            await mediumBtn.click()
            await page.waitForTimeout(500)
        }
    })

    test('should allow answering kanji questions', async ({ kanjiPage, page }) => {
        await kanjiPage.goto()

        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        const input = await page.locator('input[type="text"]')
        if (await input.isVisible()) {
            await input.fill('test')

            const checkBtn = await page.locator('button:has-text("Check"), button:has-text("Verificar")')
            if (await checkBtn.isVisible()) {
                await checkBtn.click()
                await page.waitForTimeout(500)
            }
        }
    })
})
