import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { fiveQuestionSession, mockWordset } from '../fixtures/practice'

const games = [
    { name: 'Numbers', path: '/numbers', next: 'Next Number' },
    { name: 'Dates', path: '/dates', next: 'Next Date' },
] as const
type Game = typeof games[number]

async function expectStats(page: Page, score: number, streak: number, best: number) {
    const stats = page.getByTestId('stats-display')
    for (const [label, value] of [['Score', score], ['Streak', streak], ['Best', best]] as const) {
        const column = stats.getByText(label, { exact: true }).locator('..')
        await expect(column.locator('p').first()).toHaveText(String(value))
    }
}

async function answerCorrectly(page: Page, game: Game) {
    if (game.name === 'Numbers') {
        const value = Number((await page.getByTestId('question-display').textContent())?.trim())
        expect(value).toBeGreaterThanOrEqual(1)
        expect(value).toBeLessThanOrEqual(10)
        const symbols = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
        await page.locator('#number-pad').getByRole('button', { name: symbols[value]!, exact: true }).click()
    } else {
        const showNumber = page.getByRole('button', { name: 'Show Number', exact: true })
        if (await showNumber.isVisible()) await showNumber.click()
        const month = Number((await page.getByTestId('question-display').textContent())?.trim())
        expect(month).toBeGreaterThanOrEqual(1)
        expect(month).toBeLessThanOrEqual(12)
        const answers = ['ichigatsu', 'nigatsu', 'sangatsu', 'shigatsu', 'gogatsu', 'rokugatsu', 'shichigatsu', 'hachigatsu', 'kugatsu', 'juugatsu', 'juuichigatsu', 'juunigatsu']
        await page.getByRole('textbox').fill(answers[month - 1]!)
    }
    await page.getByRole('button', { name: 'Check', exact: true }).click()
    await expect(page.getByText('Correct!', { exact: true })).toBeVisible()
}

async function expectFreshQuestion(page: Page, game: Game) {
    await expect(page.getByRole('button', { name: game.next, exact: true })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Skip', exact: true })).toBeEnabled()
    if (game.name === 'Numbers') {
        await expect(page.getByText('Use the keypad below', { exact: true })).toBeVisible()
        await expect(page.locator('#number-pad').getByRole('button').first()).toBeEnabled()
    } else {
        await expect(page.getByRole('textbox')).toBeEditable()
        await expect(page.getByRole('textbox')).toHaveValue('')
    }
}

async function changeSettings(page: Page, selection: string) {
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await page.getByRole('button', { name: selection, exact: true }).click()
    // A backdrop click closes settings without triggering the game's Escape handler.
    await page.getByTestId('popover-backdrop').click({ position: { x: 1, y: 1 } })
    await expect(page.getByTestId('popover-backdrop')).toBeHidden()
}

for (const game of games) {
    test.describe(`${game.name} shared session`, () => {
        test.beforeEach(async ({ page }) => {
            await page.goto(game.path)
            await expect(page.getByTestId('question-display')).toBeVisible()
            if (game.name === 'Dates') {
                await page.getByRole('button', { name: 'Months', exact: true }).click()
            }
            await expectFreshQuestion(page, game)
        })

        test('awards the sixth-answer bonus and consumes a skip while preserving score and best streak', async ({ page }, testInfo) => {
            for (let answered = 1; answered <= 6; answered++) {
                await answerCorrectly(page, game)
                await expectStats(page, answered === 6 ? 65 : answered * 10, answered, answered)
                await expect(page.getByTestId('stats-display')).toContainText(`${10 - answered} rounds left`)
                await page.getByRole('button', { name: game.next, exact: true }).click()
            }
            await page.getByRole('button', { name: 'Skip', exact: true }).click()
            await expectStats(page, 65, 0, 6)
            await expect(page.getByTestId('stats-display')).toContainText('3 rounds left')
            await expectFreshQuestion(page, game)
            await testInfo.attach('bonus-and-skipped-round', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
        })

        test('target and play-mode changes restart aggregates and question state', async ({ page }) => {
            await answerCorrectly(page, game)
            await expectStats(page, 10, 1, 1)
            await changeSettings(page, '5')
            await expectStats(page, 0, 0, 0)
            await expect(page.getByTestId('stats-display')).toContainText('5 rounds left')
            await expectFreshQuestion(page, game)
            if (game.name === 'Dates') {
                await expect(page.getByRole('button', { name: 'Show Number', exact: true })).toBeVisible()
            }

            await answerCorrectly(page, game)
            await changeSettings(page, 'Infinite')
            await expectStats(page, 0, 0, 0)
            await expectFreshQuestion(page, game)
            await expect(page.getByTestId('stats-display')).not.toContainText('rounds left')
            // The retained five-round target does not complete an infinite session.
            for (let skipped = 0; skipped < 6; skipped++) {
                await page.getByRole('button', { name: 'Skip', exact: true }).click()
                await expectFreshQuestion(page, game)
            }
            await expect(page.getByRole('heading', { name: 'Session complete', exact: true })).toBeHidden()
            await answerCorrectly(page, game)
            await expectStats(page, 10, 1, 1)
            await changeSettings(page, 'Session')
            await expectStats(page, 0, 0, 0)
            await expect(page.getByTestId('stats-display')).toContainText('5 rounds left')
            await expectFreshQuestion(page, game)
        })

        test('a final skip completes the session and locks every answering control', async ({ page }, testInfo) => {
            await fiveQuestionSession(page)
            for (let remaining = 4; remaining >= 0; remaining--) {
                await page.getByRole('button', { name: 'Skip', exact: true }).click()
                await expect(page.getByTestId('stats-display')).toContainText(`${remaining} rounds left`)
            }
            await expect(page.getByRole('heading', { name: 'Session complete', exact: true })).toBeVisible()
            await expectStats(page, 0, 0, 0)
            await expect(page.getByRole('button', { name: 'Skip', exact: true })).toBeDisabled()
            await expect(page.getByRole('button', { name: 'Check', exact: true })).toBeDisabled()
            if (game.name === 'Numbers') {
                for (const key of await page.locator('#number-pad').getByRole('button').all()) {
                    await expect(key).toBeDisabled()
                }
                const editingControls = page.getByRole('button', { name: 'Clear', exact: true }).locator('..')
                for (const control of await editingControls.getByRole('button').all()) {
                    await expect(control).toBeDisabled()
                }
            } else {
                await expect(page.getByRole('textbox')).toHaveAttribute('readonly', '')
                await expect(page.getByRole('textbox')).not.toBeEditable()
            }
            const completedQuestion = await page.getByTestId('question-display').textContent()
            await page.keyboard.press('Enter')
            await expect(page.getByTestId('question-display')).toHaveText(completedQuestion!)
            await expect(page.getByTestId('stats-display')).toContainText('0 rounds left')
            await testInfo.attach('completed-by-skip', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
            await page.getByRole('button', { name: 'Restart session', exact: true }).click()
            await expect(page.getByRole('heading', { name: 'Session complete', exact: true })).toBeHidden()
            await expect(page.getByTestId('stats-display')).toContainText('5 rounds left')
            await expectFreshQuestion(page, game)
        })
    })
}

test('Words keeps answer accuracy separate from session accuracy when rounds are skipped', async ({ page, wordsPage }, testInfo) => {
    await mockWordset(page)
    await wordsPage.goto()
    await page.getByTestId('settings-trigger').filter({ visible: true }).click()
    const settings = page.getByRole('dialog', { name: 'Practice Settings', exact: true })
    await settings.getByRole('button', { name: 'Session', exact: true }).click()
    await settings.getByRole('button', { name: '5', exact: true }).click()
    await settings.getByRole('button', { name: 'Save Settings', exact: true }).click()
    await expect(settings).toBeHidden()
    await expect(page.getByTestId('question-display')).toHaveText('あいう')
    await page.getByRole('textbox').fill('aiu')
    await page.getByRole('button', { name: 'Check', exact: true }).click()
    await expectStats(page, 1, 1, 1)
    await expect(page.getByText('Accuracy: 100%', { exact: true })).toBeVisible()
    const next = page.getByRole('button', { name: 'Next Word', exact: true })
    for (let remaining = 3; remaining >= 0; remaining--) {
        await next.click()
        await expect(page.getByRole('textbox')).toBeEditable()
        await page.getByRole('button', { name: 'Skip', exact: true }).click()
        await expect(page.getByTestId('stats-display')).toContainText(`${remaining} rounds left`)
        await expect(page.getByRole('textbox')).toHaveAttribute('readonly', '')
        await expect(page.getByText('aiu', { exact: true })).toBeVisible()
        await expect(page.getByText('Accuracy: 100%', { exact: true })).toBeVisible()
    }
    await expectStats(page, 1, 0, 1)
    await expect(page.getByRole('heading', { name: 'Session complete', exact: true })).toBeVisible()
    await expect(page.getByText('20% Accuracy', { exact: true })).toBeVisible()
    await expect(next).toBeDisabled()
    await testInfo.attach('word-answer-and-session-accuracy', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
})
