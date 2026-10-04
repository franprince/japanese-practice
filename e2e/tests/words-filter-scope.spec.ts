import { test, expect } from '../fixtures'
import { fixtureManifest } from '../../src/test/wordset-fixture'

for (const gameType of ['words', 'characters', 'guess'] as const) {
    test(`${gameType} uses the explicit subject while preserving Custom filters`, async ({ page }) => {
        const wordset = {
            version: 1,
            hiraganaWords: [{ kana: 'あいう', romaji: 'aiu', type: 'hiragana', groups: ['h1'] }],
            katakanaWords: [{ kana: 'アイウ', romaji: 'aiu', type: 'katakana', groups: ['k1'] }],
            bothForms: [],
        }
        await page.route('**/wordsets/manifest.json', route => route.fulfill({ json: fixtureManifest(wordset) }))
        await page.route('**/wordsets/*-*.json', route => route.fulfill({ json: wordset }))
        await page.addInitScript(({ gameType }) => {
            localStorage.setItem('practice-settings-words-v1', JSON.stringify({
                version: 1, mode: 'custom', gameType, playMode: 'infinite', targetCount: 10,
                filter: { selectedGroups: ['h1'], minLength: 10, maxLength: 10 },
            }))
        }, { gameType })
        await page.goto('/words')
        await page.getByTestId('settings-trigger').click()
        const dialog = page.getByRole('dialog', { name: 'Practice Settings', exact: true })
        await dialog.getByRole('button', { name: 'ア Katakana', exact: true }).click()
        await dialog.getByRole('button', { name: 'Save Settings', exact: true }).click()
        await expect(page.getByTestId('question-display')).toHaveText(
            gameType === 'words' ? 'アイウ' : gameType === 'guess' ? /^[\u30A0-\u30FF]+$/ : /^[\u30A0-\u30FF]{3,12}$/,
        )
        await page.getByTestId('settings-trigger').click()
        await dialog.getByRole('button', { name: /Custom/ }).click()
        await expect(dialog.getByRole('button', { name: 'あ', exact: true })).toHaveAttribute('aria-pressed', 'true')
        await expect(dialog.getByRole('button', { name: 'ア', exact: true })).toHaveAttribute('aria-pressed', 'false')
        if (gameType !== 'guess') await expect(dialog).toContainText('10 — 10')
        await page.keyboard.press('Escape')
        const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('practice-settings-words-v1')!))
        expect(stored.filter).toEqual({ selectedGroups: ['h1'], minLength: 10, maxLength: 10 })
    })
}
