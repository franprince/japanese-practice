import { test, expect } from '../fixtures'
import { mockWordset, kanji, fiveQuestionSession } from '../fixtures/practice'
import type { Page } from '@playwright/test'

const settings = (page: Page) => page.getByRole('dialog', { name: 'Practice Settings', exact: true })
const question = (page: Page) => page.getByTestId('question-display')

for (const game of ['words', 'numbers', 'dates', 'kanji'] as const) {
    test(`${game} reviews only unique missed questions and clears review on restart`, async ({ page }) => {
        await mockWordset(page)
        await page.route('**/kanji-n*.json', route => route.fulfill({ json: kanji }))
        await page.goto(`/${game}`)
        await expect(question(page)).toBeVisible()
        await fiveQuestionSession(page)
        const missed = new Set<string>()
        const next = game === 'words' ? 'Next Word' : game === 'numbers' ? 'Next Number' : game === 'dates' ? 'Next Date' : 'Next Kanji'
        for (let index = 0; index < 5; index++) {
            const prompt = (await question(page).innerText()).trim()
            missed.add(prompt)
            if (game === 'words' || game === 'dates') {
                await page.getByRole('textbox').fill('zzzz')
                await page.getByRole('button', { name: 'Check', exact: true }).click()
            } else if (game === 'numbers') {
                await page.locator('#number-pad').getByRole('button', { name: '万', exact: true }).click()
                await page.getByRole('button', { name: 'Check', exact: true }).click()
            } else {
                const wrong = kanji.find(item => item.char !== prompt)!
                await page.locator('#kanji-options').getByRole('button', { name: new RegExp(wrong.reading) }).click()
            }
            await expect(page.getByText('Incorrect', { exact: true })).toBeVisible()
            if (index < 4) await page.getByRole('button', { name: next, exact: true }).click()
        }
        await expect(page.getByRole('heading', { name: 'Session complete', exact: true })).toBeVisible()
        await expect(page.getByText(`${missed.size} items to review`, { exact: true })).toBeVisible()
        await page.getByRole('button', { name: 'Practice missed items', exact: true }).click()
        await expect(page.getByText('Reviewing missed items', { exact: true })).toBeVisible()
        for (let index = 0; index < missed.size; index++) {
            await expect(question(page)).toBeVisible()
            const prompt = (await question(page).innerText()).trim()
            expect(missed.has(prompt)).toBe(true)
            // Answer correctly where the fixture exposes the expected reading. Dates uses skips to exercise review-of-review.
            if (game === 'words') {
                await page.getByRole('textbox').fill('aiu')
                await page.getByRole('button', { name: 'Check', exact: true }).click()
            } else if (game === 'numbers') {
                const symbols = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
                await page.locator('#number-pad').getByRole('button', { name: symbols[Number(prompt)]!, exact: true }).click()
                await page.getByRole('button', { name: 'Check', exact: true }).click()
            } else if (game === 'kanji') {
                const answer = kanji.find(item => item.char === prompt)!
                await page.locator('#kanji-options').getByRole('button', { name: new RegExp(answer.reading) }).click()
            } else await page.getByRole('button', { name: 'Skip', exact: true }).click()
            if (game !== 'dates') {
                await expect(page.getByText('Correct!', { exact: true })).toBeVisible()
                if (index < missed.size - 1) await page.getByRole('button', { name: next, exact: true }).click()
            }
        }
        await expect(page.getByRole('heading', { name: 'Session complete', exact: true })).toBeVisible()
        if (game !== 'dates') await expect(page.getByRole('button', { name: 'Practice missed items', exact: true })).toBeHidden()
        else await expect(page.getByRole('button', { name: 'Practice missed items', exact: true })).toBeVisible()
        await page.getByRole('button', { name: 'Restart session', exact: true }).click()
        await expect(page.getByText('Reviewing missed items', { exact: true })).toBeHidden()
        await expect(page.getByTestId('session-progress')).toContainText('of 5')
    })
}

test('mobile settings cancel preserves input, apply restarts and persists the configuration', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dates')
    const input = page.getByRole('textbox', { name: 'Your answer in hiragana or romaji' })
    await input.fill('unfinished')
    const initial = await question(page).innerText()
    await page.getByTestId('settings-trigger').click()
    await settings(page).getByRole('button', { name: 'Months', exact: true }).click()
    await expect(settings(page).getByText(/Changing settings starts/)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(settings(page)).toBeHidden()
    await expect(input).toHaveValue('unfinished')
    await expect(question(page)).toHaveText(initial)
    await page.getByTestId('settings-trigger').click()
    await settings(page).getByRole('button', { name: 'Months', exact: true }).click()
    await settings(page).getByRole('button', { name: '20', exact: true }).click()
    await settings(page).getByRole('button', { name: 'Save Settings', exact: true }).click()
    await expect(input).toHaveValue('')
    await expect(page.getByTestId('session-progress')).toContainText('of 20')
    await page.reload()
    await expect(page.getByTestId('session-progress')).toContainText('of 20')
    await expect(page.getByText('Write the month reading in hiragana', { exact: true })).toBeVisible()
})

test('beginner preset and practice-again start a fresh saved session', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('game-selector')).toHaveCount(4)
    for (const description of await page.getByTestId('game-selector').locator('p').all()) await expect(description).toBeVisible()
    await page.getByRole('button', { name: 'Start hiragana · 5 questions', exact: true }).click()
    await expect(page.getByTestId('guess-option')).toHaveCount(3)
    await expect(page).toHaveURL('/words')
    await expect(page.getByTestId('session-progress')).toContainText('of 5')
    await page.getByTestId('guess-option').first().click()
    await page.getByRole('link', { name: '← Home', exact: true }).click()
    await page.getByRole('link', { name: 'Practice again', exact: true }).click()
    await expect(page.getByTestId('guess-option')).toHaveCount(3)
    await expect(page.getByTestId('session-progress')).toContainText('0 of 5 completed')
})

test('every theme defines real colors; mobile feedback stays in normal document flow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await mockWordset(page)
    await page.goto('/words')
    await expect(question(page)).toBeVisible()
    const colors = new Set<string>()
    for (const theme of ['default', 'sakura', 'ocean', 'forest', 'sunset', 'daylight', 'lavender', 'mint']) {
        await page.evaluate(value => { localStorage.setItem('theme', value); window.dispatchEvent(new CustomEvent('kana-words-preference', { detail: 'theme' })) }, theme)
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        const result = await page.evaluate(() => ({ background: getComputedStyle(document.body).backgroundColor, scheme: getComputedStyle(document.documentElement).colorScheme }))
        colors.add(result.background)
        expect(result.scheme).toBe(['daylight', 'lavender', 'mint'].includes(theme) ? 'light' : 'dark')
    }
    expect(colors.size).toBe(8)
    await expect(page.getByTestId('session-progress')).toBeInViewport()
    await page.getByRole('textbox').fill('zzzz')
    await page.getByRole('button', { name: 'Check', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Incorrect' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next Word', exact: true })).toBeVisible()
    await page.getByText('Review details', { exact: true }).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const fixed = await page.locator('main button').evaluateAll(buttons => buttons.filter(button => getComputedStyle(button).position === 'fixed').length)
    expect(fixed).toBe(0)
})

test('long word content and translated settings fit a narrow viewport and return keyboard focus', async ({ page }) => {
    const { fixtureManifest } = await import('../../src/test/wordset-fixture')
    const longWord = { version: 1, hiraganaWords: [{ kana: 'あ'.repeat(24), romaji: 'a'.repeat(24), type: 'hiragana', groups: ['h1'] }], katakanaWords: [], bothForms: [] }
    await page.route('**/wordsets/manifest.json', route => route.fulfill({ json: fixtureManifest(longWord) }))
    await page.route('**/wordsets/*-*.json', route => route.fulfill({ json: longWord }))
    await page.addInitScript(() => localStorage.setItem('practice-settings-words-v1', JSON.stringify({ version: 1, mode: 'custom', gameType: 'words', playMode: 'session', targetCount: 5, filter: { minLength: 1, maxLength: 100, selectedGroups: ['h1'] } })))
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/words')
    await page.getByRole('button', { name: 'Download', exact: true }).click()
    await expect(question(page)).toHaveText('あ'.repeat(24))
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    for (const lang of ['ES', 'JA', 'EN']) {
        await page.getByRole('button', { name: lang, exact: true }).click()
        if (lang === 'ES') {
            await page.getByRole('button', { name: 'Descargar', exact: true }).click()
            await expect(page.getByRole('button', { name: 'Descargar', exact: true })).toBeHidden()
        }
        await page.getByTestId('settings-trigger').click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        const bounds = (await dialog.boundingBox())!
        expect(bounds.x).toBeGreaterThanOrEqual(0)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(320)
        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
        await expect(page.getByTestId('settings-trigger')).toBeFocused()
    }
})

test('beginner preset remains usable without local storage', async ({ browser, baseURL }) => {
    const context = await browser.newContext()
    await context.addInitScript(() => {
        Storage.prototype.setItem = () => { throw new Error('Storage unavailable') }
        Storage.prototype.getItem = () => null
    })
    const page = await context.newPage()
    await page.goto(`${baseURL}/words?preset=beginner`)
    await expect(page.getByTestId('guess-option')).toHaveCount(3)
    await expect(page.getByTestId('session-progress').locator('progress')).toHaveAttribute('max', '5')
    await context.close()
})
