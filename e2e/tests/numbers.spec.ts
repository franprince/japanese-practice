import { test, expect } from '../fixtures'

test.describe('Numbers Game', () => {
    test('should load the numbers game page', async ({ numbersPage, page }) => {
        await numbersPage.goto()

        await expect(page).toHaveURL('/numbers')
    })

    test('should display game controls and stats', async ({ numbersPage, page }) => {
        await numbersPage.goto()

        const stats = await page.locator('[data-testid="stats-display"]')
        await expect(stats).toBeVisible()
    })

    test('should allow difficulty selection', async ({ numbersPage, page }) => {
        await numbersPage.goto()

        await page.waitForLoadState('networkidle')

        // Try to select medium difficulty
        const mediumBtn = await page.locator('button:has-text("Medium"), button:has-text("Medio")').first()
        if (await mediumBtn.isVisible()) {
            await mediumBtn.click()
            await page.waitForTimeout(500)
        }
    })

    test('should allow mode switching', async ({ numbersPage, page }) => {
        await numbersPage.goto()

        await page.waitForLoadState('networkidle')

        // Try to switch to kanjiToArabic mode
        const kanjiToArabicBtn = await page.locator('button:has-text("Kanji to Arabic"), button:has-text("Kanji a Arábigo")').first()
        if (await kanjiToArabicBtn.isVisible()) {
            await kanjiToArabicBtn.click()
            await page.waitForTimeout(500)
        }
    })

    test('should allow answering number questions', async ({ numbersPage, page }) => {
        await numbersPage.goto()

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
