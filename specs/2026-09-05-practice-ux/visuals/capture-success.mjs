// Run from the repository root against a production server:
// node specs/2026-09-05-practice-ux/visuals/capture-success.mjs http://127.0.0.1:3101
import { chromium, expect } from '@playwright/test'
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const output = join(dirname(fileURLToPath(import.meta.url)), 'success')
const baseURL = process.argv[2] || 'http://127.0.0.1:3101'
const dictionary = JSON.parse(readFileSync('src/lib/japanese/shared/kanaDictionary.json', 'utf8'))
const characters = Object.assign({}, ...Object.values(dictionary.hiragana).map(group => group.characters))
const kanji = JSON.parse(readFileSync('public/kanji-n5.json', 'utf8'))
const weekdays = Object.fromEntries(['Sunday:nichiyoubi', 'Monday:getsuyoubi', 'Tuesday:kayoubi', 'Wednesday:suiyoubi', 'Thursday:mokuyoubi', 'Friday:kinyoubi', 'Saturday:doyoubi'].map(value => value.split(':')))
const numerals = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
const nextLabels = { words: 'Next Word', numbers: 'Next Number', dates: 'Next Date', kanji: 'Next Kanji' }
const common = { version: 1, playMode: 'session', targetCount: 5 }
const settings = {
    words: { ...common, mode: 'custom', gameType: 'characters', filter: { minLength: 3, maxLength: 3, selectedGroups: ['h1', 'h2', 'h3'] } },
    numbers: { ...common, mode: 'arabicToKanji', difficulty: 'easy' },
    dates: { ...common, mode: 'week_days' },
    kanji: { ...common, difficulty: 'easy' },
}
mkdirSync(output, { recursive: true })
const browser = await chromium.launch()
try {
    for (const [size, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
        const context = await browser.newContext({ viewport: { width, height }, isMobile: size === 'mobile', hasTouch: size === 'mobile', reducedMotion: 'reduce' })
        await context.addInitScript(preferences => {
            localStorage.setItem('kana-words-lang', 'en')
            localStorage.setItem('theme', 'default')
            for (const [game, value] of Object.entries(preferences)) localStorage.setItem(`practice-settings-${game}-v1`, JSON.stringify(value))
        }, settings)
        const page = await context.newPage()
        const errors = []
        page.on('pageerror', error => errors.push(error.message))
        const capture = async name => {
            await page.evaluate(() => document.fonts.ready)
            await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
            await page.screenshot({ path: join(output, `${size}-${name}.png`), fullPage: true, animations: 'disabled' })
            console.log(`${size}-${name}: verified and captured`)
        }
        const answer = async game => {
            const prompt = (await page.getByTestId('question-display').innerText()).trim()
            if (game === 'kanji') {
                const entry = kanji.find(item => item.char === prompt)
                expect(entry).toBeTruthy()
                await page.locator('#kanji-options').getByRole('button').filter({ hasText: entry.reading }).click()
            } else {
                if (game === 'numbers') {
                    await page.locator('#number-pad').getByRole('button', { name: numerals[Number(prompt)], exact: true }).click()
                } else {
                    const value = game === 'words' ? [...prompt].map(char => characters[char][0]).join('') : weekdays[prompt]
                    expect(value).toBeTruthy()
                    await page.getByRole('textbox').fill(value)
                }
                await page.getByRole('button', { name: 'Check', exact: true }).click()
            }
            await expect(page.getByText('Correct!', { exact: true })).toBeVisible()
        }
        for (const game of Object.keys(settings)) {
            await page.goto(`${baseURL}/${game}`)
            await expect(page.getByTestId('question-display')).toBeVisible()
            for (let index = 0; index < 5; index++) {
                await answer(game)
                await expect(page.getByTestId('session-progress')).toContainText(index === 4 ? "5 questions completed" : `${index + 1} of 5 completed`)
                if (index === 0) await capture(`${game}-correct`)
                if (index < 4) await page.getByRole('button', { name: nextLabels[game], exact: true }).click()
            }
            const summary = page.getByRole('region', { name: 'Session complete', exact: true })
            await expect(summary).toContainText('100%')
            await expect(summary.getByRole('button', { name: 'Restart session', exact: true })).toBeEnabled()
            await expect(page.getByRole('button', { name: 'Practice missed items', exact: true })).toBeHidden()
            await capture(`${game}-complete`)
        }
        // Recover a real skipped question, then finish its focused review correctly.
        await page.goto(`${baseURL}/words`)
        await expect(page.getByTestId('question-display')).toBeVisible()
        await page.getByRole('button', { name: 'Skip', exact: true }).click()
        await page.getByRole('button', { name: 'Next Word', exact: true }).click()
        for (let index = 0; index < 4; index++) {
            await answer('words')
            if (index < 3) await page.getByRole('button', { name: 'Next Word', exact: true }).click()
        }
        await page.getByRole('button', { name: 'Practice missed items', exact: true }).click()
        await expect(page.getByText('Reviewing missed items', { exact: true })).toBeVisible()
        await answer('words')
        await expect(page.getByRole('region', { name: 'Session complete', exact: true })).toContainText('100%')
        await expect(page.getByTestId('session-progress')).toContainText('1 questions completed')
        await expect(page.getByRole('button', { name: 'Practice missed items', exact: true })).toBeHidden()
        await capture('words-review-complete')
        expect(errors).toEqual([])
        await context.close()
    }
} finally {
    await browser.close()
}
