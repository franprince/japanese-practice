import { test, expect } from '../fixtures'
import { fiveQuestionSession, finishSession, kanji } from '../fixtures/practice'

test.describe('Kanji game', () => {
    test.beforeEach(async ({ kanjiPage, page }) => {
        await page.route('**/kanji-n*.json', route => route.fulfill({ json: route.request().url().endsWith('kanji-n5.json') ? kanji : [] }))
        await kanjiPage.goto()
        await expect(page.locator('#kanji-options button')).toHaveCount(3)
    })
    test('difficulty changes the available hints', async ({ page }) => {
        const options = page.locator('#kanji-options')
        await expect(options.getByText('sun', { exact: true })).toBeVisible()
        await expect(options.getByText('hi', { exact: true }).first()).toBeVisible()
        await page.getByTestId('settings-trigger').click()
        let settings = page.getByRole('dialog', { name: 'Practice Settings', exact: true })
        await settings.getByRole('button', { name: /^Medium/ }).click()
        await settings.getByRole('button', { name: 'Save Settings', exact: true }).click()
        await expect(options.getByText('sun', { exact: true })).toBeVisible()
        await expect(options.getByText('hi', { exact: true })).toHaveCount(0)
        await page.getByTestId('settings-trigger').click()
        settings = page.getByRole('dialog', { name: 'Practice Settings', exact: true })
        await settings.getByRole('button', { name: /^Hard/ }).click()
        await settings.getByRole('button', { name: 'Save Settings', exact: true }).click()
        await expect(options.getByText('sun', { exact: true })).toHaveCount(0)
        await expect(options.locator('[lang="ja"]')).toHaveCount(3)
    })
    test('correct and incorrect options produce distinct feedback and lock answers', async ({ page }) => {
        for (const correct of [true, false]) {
            const char = (await page.getByTestId('question-display').textContent())?.trim()
            const expected = kanji.find(entry => entry.char === char)
            expect(expected).toBeDefined()
            const answer = correct ? expected! : kanji.find(entry => entry.char !== char)!
            const option = page.locator('#kanji-options button').filter({ has: page.getByText(answer.meaning_en, { exact: true }) })
            await option.click()
            await expect(page.getByText(correct ? 'Correct!' : 'Incorrect', { exact: true })).toBeVisible()
            for (const button of await page.locator('#kanji-options button').all()) await expect(button).toBeDisabled()
            await page.keyboard.press('Enter')
            await expect(page.locator('#kanji-options button').first()).toBeEnabled()
            await expect(page.getByRole('button', { name: 'Next Kanji', exact: true })).toBeHidden()
        }
    })
    test('settings open and dismiss with Escape', async ({ page }) => {
        await page.getByTestId('settings-trigger').click()
        const settings = page.getByRole('dialog', { name: 'Practice Settings', exact: true })
        await expect(settings.getByRole('button', { name: 'Session', exact: true })).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(settings).toBeHidden()
    })
    test('completes exactly five answers and restarts the session', async ({ page }) => {
        await fiveQuestionSession(page)
        await finishSession(page, async () => {
            await page.locator('#kanji-options button').first().click()
        }, 'Next Kanji')
        await expect(page.locator('#kanji-options button').first()).toBeEnabled()
    })
})
