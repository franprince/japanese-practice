import { test, expect } from '../fixtures'
import { fixtureManifest } from '../../src/test/wordset-fixture'

for (const [kana, romaji, kanji, answer, correct] of [
    ['はは', 'haha', '母', 'hawa', false],
    ['いろは', 'iroha', '伊呂波', 'irowa', false],
    ['は', 'ha', '歯', 'wa', false],
    ['こんにちは', 'konnichiha', '今日は', 'konnichiwa', true],
    ['へ', 'he', undefined, 'e', true],
] as const) {
    test(`Words ${correct ? 'accepts' : 'rejects'} ${answer} for ${kana}`, async ({ page }) => {
        const groups = ['h1', 'h2', 'h4', 'h5', 'h6', 'h9', 'h10']
        const wordset = {
            version: 1, hiraganaWords: [{ kana, romaji, kanji, type: 'hiragana', groups }],
            katakanaWords: [], bothForms: [],
        }
        await page.route('**/wordsets/manifest.json', route => route.fulfill({ json: fixtureManifest(wordset) }))
        await page.route('**/wordsets/*-*.json', route => route.fulfill({ json: wordset }))
        await page.addInitScript(({ groups, length }) => {
            localStorage.setItem('practice-settings-words-v1', JSON.stringify({
                version: 1, mode: 'custom', gameType: 'words', playMode: 'session', targetCount: 1,
                filter: { selectedGroups: groups, minLength: length, maxLength: length },
            }))
        }, { groups, length: kana.length })
        await page.goto('/words')
        await expect(page.getByTestId('question-display')).toHaveText(kana)
        await page.getByRole('textbox').fill(answer)
        await page.getByRole('button', { name: 'Check', exact: true }).click()
        await expect(page.getByRole('status').filter({ hasText: 'Correct answer' })).toContainText(correct ? 'Correct!' : 'Incorrect')
        const summary = page.getByRole('region', { name: 'Session complete', exact: true })
        await expect(summary).toContainText(correct ? '100%' : '0%')
        if (!correct) await expect(summary.getByRole('button', { name: 'Practice missed items', exact: true })).toBeVisible()
    })
}
