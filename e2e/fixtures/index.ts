import { test as base, expect, type PlaywrightTestArgs, type PlaywrightTestOptions } from '@playwright/test'
import { HomePage } from '../pages/home.page'
import { WordsPage } from '../pages/words.page'
import { KanjiPage } from '../pages/kanji.page'
import { NumbersPage } from '../pages/numbers.page'
import { DatesPage } from '../pages/dates.page'

/**
 * Custom test fixtures with page objects
 */
export const test = base.extend<{
    homePage: HomePage
    wordsPage: WordsPage
    kanjiPage: KanjiPage
    numbersPage: NumbersPage
    datesPage: DatesPage
    browserChecks: void
}>({
    browserChecks: [async ({ page }, use) => {
        const errors: string[] = []
        page.on('pageerror', error => errors.push(error.message))
        await page.addInitScript(() => {
            if (!localStorage.getItem('kana-words-lang')) localStorage.setItem('kana-words-lang', 'en')
        })
        await use()
        expect(errors, 'uncaught browser exceptions').toEqual([])
    }, { auto: true }],
    homePage: async ({ page }: PlaywrightTestArgs & PlaywrightTestOptions, use: (r: HomePage) => Promise<void>) => {
        const homePage = new HomePage(page)
        await use(homePage)
    },
    wordsPage: async ({ page }: PlaywrightTestArgs & PlaywrightTestOptions, use: (r: WordsPage) => Promise<void>) => {
        const wordsPage = new WordsPage(page)
        await use(wordsPage)
    },
    kanjiPage: async ({ page }: PlaywrightTestArgs & PlaywrightTestOptions, use: (r: KanjiPage) => Promise<void>) => {
        const kanjiPage = new KanjiPage(page)
        await use(kanjiPage)
    },
    numbersPage: async ({ page }: PlaywrightTestArgs & PlaywrightTestOptions, use: (r: NumbersPage) => Promise<void>) => {
        const numbersPage = new NumbersPage(page)
        await use(numbersPage)
    },
    datesPage: async ({ page }: PlaywrightTestArgs & PlaywrightTestOptions, use: (r: DatesPage) => Promise<void>) => {
        const datesPage = new DatesPage(page)
        await use(datesPage)
    },
})

export { expect } from '@playwright/test'
