import { test, expect } from '../fixtures'
import { fiveQuestionSession, finishSession } from '../fixtures/practice'

test.describe('Dates game', () => {
    test.beforeEach(async ({ datesPage, page }) => {
        await datesPage.goto()
        await expect(page.getByRole('textbox')).toBeEditable()
    })
    test('mode selection changes the prompt and keeps the input usable', async ({ page }) => {
        for (const [label, prompt] of [['Months', 'Write the month'], ['Full Dates', 'Write the full date'], ['Days', 'Write the day']] as const) {
            const button = page.getByRole('button', { name: label, exact: true })
            await button.click()
            await expect(button).toHaveClass(/bg-primary/)
            await expect(page.getByTestId('question-display')).toBeVisible()
            await expect(page.getByText(new RegExp(prompt, 'i')).first()).toBeVisible()
            await expect(page.getByRole('textbox')).toBeEditable()
        }
    })
    test('Enter submits an incorrect answer and advances to an editable question', async ({ page }) => {
        const input = page.getByRole('textbox')
        await input.fill('wronganswer')
        await input.press('Enter')
        await expect(page.getByText('Incorrect', { exact: true })).toBeVisible()
        await expect(input).toHaveAttribute('readonly', '')
        await expect(page.getByRole('button', { name: 'Next Date', exact: true })).toBeVisible()
        await input.press('Enter')
        await expect(input).toBeEditable()
        await expect(input).toHaveValue('')
        await expect(page.getByText('Incorrect', { exact: true })).toBeHidden()
    })
    test('month answer is correct and toggling its display preserves typed input', async ({ page }, testInfo) => {
        await page.getByRole('button', { name: 'Months', exact: true }).click()
        const input = page.getByRole('textbox')
        await input.fill('partial')
        await page.getByRole('button', { name: 'Show Number', exact: true }).click()
        await expect(input).toHaveValue('partial')
        const month = Number((await page.getByTestId('question-display').textContent())?.trim())
        expect(month).toBeGreaterThanOrEqual(1)
        expect(month).toBeLessThanOrEqual(12)
        const answers = ['ichigatsu', 'nigatsu', 'sangatsu', 'shigatsu', 'gogatsu', 'rokugatsu', 'shichigatsu', 'hachigatsu', 'kugatsu', 'juugatsu', 'juuichigatsu', 'juunigatsu']
        await input.fill(answers[month - 1]!)
        await page.getByRole('button', { name: 'Check', exact: true }).click()
        await expect(page.getByText('Correct!', { exact: true })).toBeVisible()
        await testInfo.attach('month-display-toggle', { body: await page.screenshot(), contentType: 'image/png' })
    })
    test('completes exactly five answers and restarts the session', async ({ page }) => {
        await fiveQuestionSession(page)
        await finishSession(page, async () => {
            await page.getByRole('textbox').fill('wronganswer')
            await page.getByRole('textbox').press('Enter')
        }, 'Next Date')
        await expect(page.getByRole('textbox')).toBeEditable()
    })
})
