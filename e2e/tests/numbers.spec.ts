import { test, expect } from '../fixtures'
import { fiveQuestionSession, finishSession } from '../fixtures/practice'

test.describe('Numbers game', () => {
    test.beforeEach(async ({ numbersPage, page }) => {
        await numbersPage.goto()
        await expect(page.locator('#number-pad')).toBeVisible()
    })
    test('difficulty selection changes the active range', async ({ page }) => {
        for (const [label, maximum] of [['Easy', 10], ['Medium', 99], ['Hard', 999], ['Expert', 99999]] as const) {
            await page.getByTestId('settings-trigger').click()
            const settings = page.getByRole('dialog', { name: 'Practice Settings', exact: true })
            const button = settings.getByRole('button', { name: new RegExp(`^${label}`) })
            await button.click()
            await expect(button).toHaveAttribute('aria-pressed', 'true')
            await settings.getByRole('button', { name: 'Save Settings', exact: true }).click()
            await expect(settings).toBeHidden()
            await expect(page.locator("main header")).toContainText(label)
            await expect(page.getByTestId('question-display')).toHaveText(/^\d[\d,]*$/)
            const value = Number((await page.getByTestId('question-display').textContent())?.replaceAll(',', '').trim())
            expect(value).toBeGreaterThanOrEqual(1)
            expect(value).toBeLessThanOrEqual(maximum)
            await expect(page.locator('#number-pad')).toBeVisible()
        }
    })
    test('mode switching changes both prompt and keypad', async ({ page }) => {
        await page.getByTestId('settings-trigger').click()
        let settings = page.getByRole('dialog', { name: 'Practice Settings', exact: true })
        await settings.getByRole('button', { name: '漢 → 123', exact: true }).click()
        await settings.getByRole('button', { name: 'Save Settings', exact: true }).click()
        await expect(page.getByText('Write in Arabic', { exact: true })).toBeVisible()
        await expect(page.locator('#number-pad').getByRole('button', { name: '1', exact: true })).toBeVisible()
        await page.getByTestId('settings-trigger').click()
        settings = page.getByRole('dialog', { name: 'Practice Settings', exact: true })
        await settings.getByRole('button', { name: '123 → 漢', exact: true }).click()
        await settings.getByRole('button', { name: 'Save Settings', exact: true }).click()
        await expect(page.getByText('Write in Japanese', { exact: true })).toBeVisible()
        await expect(page.locator('#number-pad').getByRole('button', { name: '一', exact: true })).toBeVisible()
    })
    test('answers correctly through the keypad and incorrectly through the keyboard', async ({ page }) => {
        const value = Number((await page.getByTestId('question-display').textContent())?.replaceAll(',', '').trim())
        expect(value).toBeGreaterThanOrEqual(1)
        expect(value).toBeLessThanOrEqual(10)
        const symbols = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
        await page.locator('#number-pad').getByRole('button', { name: symbols[value]!, exact: true }).click()
        await page.getByRole('button', { name: 'Check', exact: true }).click()
        await expect(page.getByText('Correct!', { exact: true })).toBeVisible()
        await page.getByRole('button', { name: 'Next Number', exact: true }).click()
        await expect(page.locator('#number-pad')).toBeVisible()
        // A valid number outside Easy's 1–10 range is always incorrect.
        for (const symbol of ['十', '一']) await page.locator('#number-pad').getByRole('button', { name: symbol, exact: true }).click()
        await page.locator('main').click({ position: { x: 2, y: 2 } })
        await page.keyboard.press('Enter')
        await expect(page.getByText('Incorrect', { exact: true })).toBeVisible()
        await page.keyboard.press('Enter')
        await expect(page.locator('#number-pad')).toBeVisible()
        await expect(page.getByText('Use the keypad below', { exact: true })).toBeVisible()
    })
    test('completes exactly five answers and restarts the session', async ({ page }, testInfo) => {
        await fiveQuestionSession(page)
        await finishSession(page, async () => {
            await page.locator('#number-pad').getByRole('button', { name: '一', exact: true }).click()
            await page.getByRole('button', { name: 'Check', exact: true }).click()
        }, 'Next Number')
        await expect(page.locator('#number-pad')).toBeVisible()
        await testInfo.attach('restarted-session', { body: await page.screenshot(), contentType: 'image/png' })
    })
})


test('keypad and question stay stable while entering and clearing input', async ({ page }, testInfo) => {
    await page.goto('/numbers')
    const pad = page.locator('#number-pad')
    await expect(pad).toBeVisible()
    const order = await pad.getByRole('button').allTextContents()
    const question = await page.getByTestId('question-display').textContent()
    await pad.getByRole('button', { name: '一', exact: true }).click()
    await expect(pad.getByRole('button')).toHaveText(order)
    await page.getByRole('button', { name: 'Clear', exact: true }).click()
    await expect(page.getByTestId('question-display')).toHaveText(question!)
    await expect(pad.getByRole('button')).toHaveText(order)
    await testInfo.attach('lifecycle-keypad', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
})

// Clear / backspace / Check share one row under the keypad; on narrow phones "Comprobar" used to run
// past its button.
for (const width of [320, 360, 390]) {
    test(`keypad actions keep their labels inside their buttons at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        for (const language of ['es', 'en', 'ja']) {
            await page.goto('/numbers')
            await page.evaluate((lang) => localStorage.setItem('kana-words-lang', lang), language)
            await page.reload()
            const pad = page.locator('#number-pad')
            await expect(pad).toBeVisible()
            await pad.getByRole('button').first().click()
            await page.evaluate(() => document.fonts.ready)
            const buttons = await pad.evaluate((keys) => {
                const row = keys.nextElementSibling!
                const rowBox = row.getBoundingClientRect()
                return Array.from(row.querySelectorAll('button')).map((button) => {
                    const box = button.getBoundingClientRect()
                    const style = getComputedStyle(button)
                    const range = document.createRange()
                    range.selectNodeContents(button)
                    const content = range.getBoundingClientRect()
                    return {
                        label: button.textContent?.trim() || button.getAttribute('aria-label'),
                        // How far the icon and label reach into the padding, and the button past the row.
                        content: Math.max(box.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft) - content.left, content.right - (box.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight))),
                        row: Math.max(rowBox.left - box.left, box.right - rowBox.right),
                    }
                })
            })
            for (const { label, content, row } of buttons) {
                expect(content, `${language}: "${label}" reaches into its padding`).toBeLessThanOrEqual(0.5)
                expect(row, `${language}: "${label}" sticks out of the row`).toBeLessThanOrEqual(0.5)
            }
        }
    })
}
