import { test, expect } from '../fixtures'
import { mockWordset } from '../fixtures/practice'

for (const gameType of ['characters', 'guess'] as const) {
    test(`Custom ${gameType} practices both selected scripts`, async ({ page }) => {
        await mockWordset(page)
        await page.addInitScript(({ gameType }) => {
            localStorage.setItem('practice-settings-words-v1', JSON.stringify({
                version: 1, mode: 'custom', gameType, playMode: 'infinite', targetCount: 10,
                filter: { selectedGroups: ['h1', 'k1'], minLength: 1, maxLength: 1 },
            }))
            let draw = 0
            Math.random = () => draw++ < 33 ? 0 : [0.1, 0.2, 0.3][draw % 3]!
        }, { gameType })
        await page.goto('/words')
        await expect(page.getByTestId('question-display')).toHaveText('あ')
        // Changing the random sample forces the other selected group next round.
        // Guess fallbacks need varying randomness to choose distinct distractors.
        await page.evaluate(() => {
            let draw = 0
            Math.random = () => draw++ < 33 ? 0.99 : [0.1, 0.2, 0.3][draw % 3]!
        })
        await page.getByRole('button', { name: 'Skip', exact: true }).click()
        await page.getByRole('button', { name: 'Next Word', exact: true }).click()
        await expect(page.getByTestId('question-display')).toHaveText('オ')
    })
}
