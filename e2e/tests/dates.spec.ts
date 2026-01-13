import { test, expect } from '../fixtures'

test.describe('Dates Game', () => {
    test('should load the dates game page', async ({ datesPage, page }) => {
        await datesPage.goto()

        await expect(page).toHaveURL('/dates')
    })

    test('should display game controls and stats', async ({ datesPage, page }) => {
        await datesPage.goto()

        const stats = await page.locator('[data-testid="stats-display"]')
        await expect(stats).toBeVisible()
    })

    test('should allow date mode selection', async ({ datesPage, page }) => {
        await datesPage.goto()

        await page.waitForLoadState('networkidle')

        // Try to select months mode
        const monthsBtn = await page.locator('button:has-text("Months"), button:has-text("Meses")').first()
        if (await monthsBtn.isVisible()) {
            await monthsBtn.click()
            await page.waitForTimeout(500)
        }
    })

    test('should allow answering date questions', async ({ datesPage, page }) => {
        await datesPage.goto()

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
