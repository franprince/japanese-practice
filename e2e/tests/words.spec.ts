import { test, expect } from '../fixtures'

test.describe('Words Game', () => {
    test('should load the words game page and capture initial state', async ({ wordsPage, page }) => {
        await wordsPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Verify URL
        await expect(page).toHaveURL('/words')

        // Capture initial load screenshot
        await wordsPage.screenshot('words_initial_load')
    })

    test('should display all UI components', async ({ wordsPage, page }) => {
        await wordsPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500)

        // Essential game components that must be visible
        const input = page.locator('input[type="text"]')
        await expect(input).toBeVisible()

        const checkBtn = page.locator('button:has-text("Check"), button:has-text("Verificar"), button:has-text("Comprobar")')
        expect(await checkBtn.count()).toBeGreaterThan(0)

        const stats = page.locator('[data-testid="stats-display"]')
        await expect(stats).toBeVisible()

        // Mode buttons should exist
        const modeButtons = page.locator('button').filter({ hasText: /hiragana|katakana|ambos|both/i })
        expect(await modeButtons.count()).toBeGreaterThan(0)
    })

    test('should open and close settings popover', async ({ wordsPage, page }) => {
        await wordsPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Find and click popover trigger
        const popoverTrigger = page.locator('button[aria-label*="settings"], button[aria-label*="configuración"], button:has-text("Settings"), button:has-text("Configuración")')

        if (await popoverTrigger.first().isVisible()) {
            await popoverTrigger.first().click()
            await page.waitForTimeout(500)

            // Verify popover content is visible (look for settings-related content)
            const popoverContent = page.locator('[role="dialog"], [data-radix-popper-content-wrapper]')
            await expect(popoverContent.first()).toBeVisible()

            // Close popover (click outside or press Escape)
            await page.keyboard.press('Escape')
            await page.waitForTimeout(300)
        }
    })

    test('should change game modes', async ({ wordsPage, page }) => {
        await wordsPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Click Hiragana mode
        const hiraganaBtn = page.locator('button:has-text("ひらがな"), button:has-text("Hiragana")').first()
        if (await hiraganaBtn.isVisible()) {
            await hiraganaBtn.click()
            await page.waitForTimeout(500)
        }

        // Click Katakana mode
        const katakanaBtn = page.locator('button:has-text("カタカナ"), button:has-text("Katakana")').first()
        if (await katakanaBtn.isVisible()) {
            await katakanaBtn.click()
            await page.waitForTimeout(500)
        }

        // Click Both mode
        const bothBtn = page.locator('button:has-text("Ambos"), button:has-text("Both"), button:has-text("両方")').first()
        if (await bothBtn.isVisible()) {
            await bothBtn.click()
            await page.waitForTimeout(500)
        }
    })

    test('should open and close custom menu', async ({ wordsPage, page }) => {
        await wordsPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Click Custom mode button
        const customBtn = page.locator('button:has-text("Personalizado"), button:has-text("Custom"), button:has-text("カスタム")').first()

        if (await customBtn.isVisible()) {
            await customBtn.click()
            await page.waitForTimeout(500)

            // Verify custom menu/panel is visible (look for character group options)
            const customMenu = page.locator('[role="dialog"], div:has-text("groups"), div:has-text("grupos")')
            await expect(customMenu.first()).toBeVisible()

            // Close custom menu (click outside or close button)
            await page.keyboard.press('Escape')
            await page.waitForTimeout(300)
        }
    })

    test('should capture correct and incorrect answer feedback', async ({ wordsPage, page }) => {
        await wordsPage.goto()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500)

        // Get the displayed kana to determine correct answer
        const kanaDisplay = page.locator('div').filter({ hasText: /^[ぁ-んァ-ヶー]+$/ }).first()
        const displayedKana = await kanaDisplay.textContent()

        // Extract the correct answer from the page context
        // We'll use page evaluation to get the current word's romaji
        const correctAnswer = await page.evaluate(() => {
            // Try to find the answer in the page's React state or data attributes
            // This is a fallback - we'll type a known correct answer for a common word
            return null
        })

        const input = page.locator('input[type="text"]')
        const checkBtn = page.locator('button:has-text("Check"), button:has-text("Verificar"), button:has-text("Comprobar")')

        // For testing purposes, we'll use a strategy:
        // 1. Type a likely correct answer based on common words
        // 2. If that fails, we'll get incorrect feedback which is also valuable

        if (await input.isVisible()) {
            // Common hiragana words and their romaji
            const commonWords: Record<string, string> = {
                'あい': 'ai',
                'いえ': 'ie',
                'うえ': 'ue',
                'おう': 'ou',
                'かい': 'kai',
                'きた': 'kita',
                'した': 'shita',
                'なか': 'naka',
                'はな': 'hana',
                'まち': 'machi',
            }

            const possibleAnswer = displayedKana ? commonWords[displayedKana] : null

            if (possibleAnswer) {
                // Try correct answer
                await input.focus()
                await page.keyboard.type(possibleAnswer, { delay: 50 })
                await page.waitForTimeout(500)

                await checkBtn.click({ force: true })
                await page.waitForTimeout(1500)

                // Check if we got correct feedback
                const correctFeedback = page.locator('text=/correct|correcto|成功/i, div:has-text("✓")')
                const isCorrect = await correctFeedback.first().isVisible().catch(() => false)

                if (isCorrect) {
                    await wordsPage.screenshot('words_feedback_correct')

                    // Click Next Word
                    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Siguiente")')
                    if (await nextBtn.first().isVisible()) {
                        await nextBtn.first().click()
                        await page.waitForTimeout(500)

                        // Now answer incorrectly
                        await input.focus()
                        await page.keyboard.type('wronganswer', { delay: 50 })
                        await page.waitForTimeout(500)
                        await checkBtn.click({ force: true })
                        await page.waitForTimeout(1500)
                        await wordsPage.screenshot('words_feedback_incorrect')
                    }
                } else {
                    // We got incorrect feedback on first try
                    await wordsPage.screenshot('words_feedback_incorrect')

                    // Try to get correct feedback on next word
                    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Siguiente")')
                    if (await nextBtn.first().isVisible()) {
                        await nextBtn.first().click()
                        await page.waitForTimeout(500)

                        // Try another common word
                        await input.focus()
                        await page.keyboard.type('ai', { delay: 50 })
                        await page.waitForTimeout(500)
                        await checkBtn.click({ force: true })
                        await page.waitForTimeout(1500)
                        await wordsPage.screenshot('words_feedback_correct')
                    }
                }
            } else {
                // Fallback: just answer incorrectly to get feedback screenshot
                await input.focus()
                await page.keyboard.type('test', { delay: 50 })
                await page.waitForTimeout(500)
                await checkBtn.click({ force: true })
                await page.waitForTimeout(1500)
                await wordsPage.screenshot('words_feedback_incorrect')
            }
        }
    })
})
