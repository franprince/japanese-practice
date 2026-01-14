import { test, expect } from '../fixtures'

test.describe('Numbers Game', () => {
    test('should load the numbers game page and capture initial state', async ({ numbersPage, page }) => {
        await numbersPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        await expect(page).toHaveURL('/numbers')
        await numbersPage.screenshot('numbers_initial_load')
    })

    test('should display all UI components', async ({ numbersPage, page }) => {
        await numbersPage.goto()
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

        // Verify mode toggle buttons (just check they exist)
        const modeButtons = page.locator('button').filter({ hasText: /→|漢/ })
        expect(await modeButtons.count()).toBeGreaterThanOrEqual(2)

        // Verify number pad
        const numberPad = page.locator('#number-pad')
        await expect(numberPad).toBeVisible()
    })

    test('should allow difficulty selection', async ({ numbersPage, page }) => {
        await numbersPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500)

        // Test Easy difficulty
        const easyBtn = page.locator('button:has-text("Easy"), button:has-text("Fácil")').first()
        await easyBtn.click()
        await page.waitForTimeout(1000)
        await numbersPage.screenshot('numbers_difficulty_easy')

        // Test Medium difficulty
        const mediumBtn = page.locator('button:has-text("Medium"), button:has-text("Medio")').first()
        await mediumBtn.click()
        await page.waitForTimeout(1000)
        await numbersPage.screenshot('numbers_difficulty_medium')

        // Test Hard difficulty
        const hardBtn = page.locator('button:has-text("Hard"), button:has-text("Difícil")').first()
        await hardBtn.click()
        await page.waitForTimeout(1000)
        await numbersPage.screenshot('numbers_difficulty_hard')
    })

    test('should allow mode switching', async ({ numbersPage, page }) => {
        await numbersPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500)

        // Get mode toggle buttons
        const modeButtons = page.locator('button').filter({ hasText: /→/ })
        const buttonCount = await modeButtons.count()

        if (buttonCount >= 2) {
            // Click second mode button
            await modeButtons.nth(1).click()
            await page.waitForTimeout(1000)
            await numbersPage.screenshot('numbers_mode_switched')
        }
    })

    test('should capture incorrect answer feedback', async ({ numbersPage, page }) => {
        await numbersPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        // Click some number pad buttons
        const numberPad = page.locator('#number-pad')
        const buttons = numberPad.locator('button')

        // Click first 3 buttons
        for (let i = 0; i < 3; i++) {
            await buttons.nth(i).click()
            await page.waitForTimeout(200)
        }

        // Click check button (submit)
        const checkBtn = page.locator('button').filter({ has: page.locator('svg.lucide-corner-down-left') }).first()
        await checkBtn.click()
        await page.waitForTimeout(1500)

        // Capture screenshot
        await numbersPage.screenshot('numbers_feedback_incorrect')
    })

    test('should capture answer feedback', async ({ numbersPage, page }) => {
        await numbersPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        // Click a number pad button and submit
        const numberPad = page.locator('#number-pad')
        const buttons = numberPad.locator('button')
        await buttons.first().click()
        await page.waitForTimeout(300)

        // Submit answer
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1500)

        // Capture screenshot (will show either correct or incorrect feedback)
        await numbersPage.screenshot('numbers_feedback')
    })

    test('should allow keyboard navigation with Enter key', async ({ numbersPage, page }) => {
        await numbersPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        // Click some number pad buttons
        const numberPad = page.locator('#number-pad')
        const buttons = numberPad.locator('button')
        await buttons.first().click()
        await page.waitForTimeout(300)

        // Press Enter to submit
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1500)

        // Verify Next button appears or new question loads
        const nextBtn = page.locator('button:has-text("Next"), button:has-text("Siguiente")')
        if (await nextBtn.first().isVisible()) {
            // Press Enter again to go to next question
            await page.keyboard.press('Enter')
            await page.waitForTimeout(1000)
        }
    })

    test('should complete session mode and show summary', async ({ numbersPage, page }) => {
        await numbersPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500)

        // Open settings popover
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

        // Close popover
        await page.locator('.fixed.inset-0').click()
        await page.waitForTimeout(500)

        // Answer 5 questions
        for (let i = 0; i < 5; i++) {
            await page.waitForTimeout(1000)

            // Click some number pad buttons
            const numberPad = page.locator('#number-pad')
            const buttons = numberPad.locator('button')
            await buttons.first().click()
            await page.waitForTimeout(200)

            // Submit answer with Enter key
            await page.keyboard.press('Enter')
            await page.waitForTimeout(1500)

            // Click next button if visible and enabled
            const nextBtn = page.locator('button:has-text("Next"), button:has-text("Siguiente")').first()
            if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
                await nextBtn.click()
                await page.waitForTimeout(1000)
            }
        }

        // Wait for session summary
        await page.waitForTimeout(2000)

        // Verify and capture session summary
        const summaryCard = page.locator('text=/Session complete|Sesión completada/i, text=/Restart|Reiniciar/i').first()
        await expect(summaryCard).toBeVisible({ timeout: 5000 })

        await numbersPage.screenshot('numbers_session_complete')
    })
})
