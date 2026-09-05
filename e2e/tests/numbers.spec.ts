import { test, expect } from '../fixtures'
import { fiveQuestionSession, finishSession } from '../fixtures/practice'

test.describe('Numbers game', () => {
    test.beforeEach(async ({ numbersPage, page }) => {
        await numbersPage.goto()
        await expect(page.locator('#number-pad')).toBeVisible()
    })
    test('difficulty selection changes the active range', async ({ page }) => {
        for (const [label, maximum] of [['Easy', 10], ['Medium', 99], ['Hard', 999], ['Expert', 99999]] as const) {
            const button = page.getByRole('button', { name: new RegExp(`^${label}`) })
            await button.click()
            await expect(button).toHaveClass(/bg-primary/)
            await expect(page.getByTestId('question-display')).toHaveText(/^\d[\d,]*$/)
            const value = Number((await page.getByTestId('question-display').textContent())?.replaceAll(',', '').trim())
            expect(value).toBeGreaterThanOrEqual(1)
            expect(value).toBeLessThanOrEqual(maximum)
            await expect(page.locator('#number-pad')).toBeVisible()
        }
    })
    test('mode switching changes both prompt and keypad', async ({ page }) => {
        await page.getByRole('button', { name: '漢 → 123', exact: true }).click()
        await expect(page.getByText('Write in Arabic', { exact: true })).toBeVisible()
        await expect(page.locator('#number-pad').getByRole('button', { name: '1', exact: true })).toBeVisible()
        await page.getByRole('button', { name: '123 → 漢', exact: true }).click()
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
