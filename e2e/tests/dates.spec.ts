import { test, expect } from '../fixtures'

test.describe('Dates Game', () => {
    test('should load the dates game page and capture initial state', async ({ datesPage, page }) => {
        await datesPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        await expect(page).toHaveURL('/dates')
        await datesPage.screenshot('dates_initial_load')
    })

    test('should display all UI components', async ({ datesPage, page }) => {
        await datesPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500)

        // Verify stats display
        const stats = page.locator('[data-testid="stats-display"]')
        await expect(stats).toBeVisible()

        // Verify date mode selector buttons (just check they exist)
        const modeButtons = page.locator('button').filter({ has: page.locator('svg.lucide-calendar, svg.lucide-calendar-days, svg.lucide-calendar-range') })
        expect(await modeButtons.count()).toBeGreaterThanOrEqual(2)

        // Verify input field
        const input = page.locator('input[type="text"]')
        await expect(input).toBeVisible()

        // Verify check button
        const checkBtn = page.locator('button').filter({ has: page.locator('svg.lucide-check') })
        expect(await checkBtn.count()).toBeGreaterThan(0)
    })

    test('should allow date mode selection', async ({ datesPage, page }) => {
        await datesPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500)

        // Get mode buttons
        const modeButtons = page.locator('button').filter({ has: page.locator('svg.lucide-calendar, svg.lucide-calendar-days, svg.lucide-calendar-range') })
        const buttonCount = await modeButtons.count()

        if (buttonCount >= 2) {
            // Click second mode button
            await modeButtons.nth(1).click()
            await page.waitForTimeout(1000)
            await datesPage.screenshot('dates_mode_switched')
        }
    })

    test('should capture incorrect answer feedback', async ({ datesPage, page }) => {
        await datesPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        const input = page.locator('input[type="text"]')
        const checkBtn = page.locator('button').filter({ has: page.locator('svg.lucide-check') }).first()

        // Type an incorrect answer
        await input.click()
        await input.fill('wronganswer')
        await page.waitForTimeout(500)

        // Click check
        await checkBtn.click()
        await page.waitForTimeout(1500)

        // Capture screenshot
        await datesPage.screenshot('dates_feedback_incorrect')
    })

    test('should capture answer feedback', async ({ datesPage, page }) => {
        await datesPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        const input = page.locator('input[type="text"]')

        // Type any answer and submit
        await input.click()
        await input.fill('test')
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1500)

        // Capture screenshot (will show either correct or incorrect feedback)
        await datesPage.screenshot('dates_feedback')
    })

    test('should allow keyboard navigation with Enter key', async ({ datesPage, page }) => {
        await datesPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        const input = page.locator('input[type="text"]')

        // Type any answer and press Enter
        await input.click()
        await input.fill('test')
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

    test('should complete session mode and show summary', async ({ datesPage, page }) => {
        await datesPage.goto()
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

            const input = page.locator('input[type="text"]')
            await input.click()
            await input.fill('test')
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

        await datesPage.screenshot('dates_session_complete')
    })
})
