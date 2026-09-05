import { expect, type Page } from '@playwright/test'
import type { WordSets } from '../../src/types/api'

export const wordset: WordSets = {
    version: 1,
    hiraganaWords: [{ kana: 'あいう', romaji: 'aiu', type: 'hiragana', groups: ['h1'] }],
    katakanaWords: [], bothForms: [],
}
export const kanji = [
    { char: '日', reading: 'ひ', meaning_en: 'sun', meaning_es: 'sol', jlpt: 'jlpt-5' },
    { char: '月', reading: 'つき', meaning_en: 'moon', meaning_es: 'luna', jlpt: 'jlpt-5' },
    { char: '水', reading: 'みず', meaning_en: 'water', meaning_es: 'agua', jlpt: 'jlpt-5' },
]
export async function mockWordset(page: Page) {
    await page.route('**/api/wordset?*', route => route.fulfill({
        status: 200, contentType: 'application/json',
        body: route.request().method() === 'HEAD' ? '' : JSON.stringify(wordset),
    }))
}
export async function selectWords(page: Page) {
    await page.getByRole('button', { name: 'Command Center', exact: true }).click()
    const settings = page.getByRole('dialog', { name: 'Practice Settings', exact: true })
    await settings.getByRole('button', { name: 'Words Vocabulary practice', exact: true }).click()
    await settings.getByRole('button', { name: 'Save Settings', exact: true }).click()
    await expect(settings).toBeHidden()
}
export async function fiveQuestionSession(page: Page) {
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await page.getByRole('button', { name: 'Session', exact: true }).click()
    await page.getByRole('button', { name: '5', exact: true }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('popover-backdrop')).toBeHidden()
    await expect(page.getByTestId('stats-display')).toContainText('5 rounds left')
}
export async function finishSession(page: Page, answer: () => Promise<void>, nextLabel: string) {
    for (let index = 0; index < 5; index++) {
        await expect(page.getByRole('heading', { name: 'Session complete', exact: true })).toBeHidden()
        await answer()
        await expect(page.getByTestId('stats-display')).toContainText(`${4 - index} rounds left`)
        if (index < 4) {
            const next = page.getByRole('button', { name: nextLabel, exact: true })
            await expect(next).toBeEnabled()
            await next.click()
            await expect(next).toBeHidden()
        }
    }
    await expect(page.getByRole('heading', { name: 'Session complete', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: nextLabel, exact: true })).toBeDisabled()
    await page.getByRole('button', { name: 'Restart session', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Session complete', exact: true })).toBeHidden()
    await expect(page.getByTestId('stats-display')).toContainText('5 rounds left')
}
export async function readWordset(page: Page, lang = 'en') {
    return page.evaluate(language => new Promise((resolve, reject) => {
        const open = indexedDB.open('kana-words', 3)
        open.onerror = () => reject(open.error)
        open.onblocked = () => reject(new Error('Cache read blocked'))
        open.onsuccess = () => {
            const db = open.result
            const tx = db.transaction('wordSets', 'readonly')
            const read = tx.objectStore('wordSets').get(`prod-${language}`)
            tx.oncomplete = () => { resolve(read.result ?? null); db.close() }
            tx.onerror = tx.onabort = () => { reject(tx.error); db.close() }
        }
    }), lang)
}
