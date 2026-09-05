import { test, expect } from '../fixtures'
import en from '../../src/locales/en.json'
import es from '../../src/locales/es.json'

test.describe('Home Page', () => {
    test('should display the hero section with title', async ({ homePage }) => {
        await homePage.goto()

        const title = await homePage.getTitle()
        expect(title).toContain('日本語')
    })

    test('should display all 4 game cards', async ({ homePage }) => {
        await homePage.goto()

        const gameCards = await homePage.getGameCards()
        expect(gameCards).toHaveLength(4)
    })

    test('should navigate to words game when clicking words card', async ({ homePage, page }) => {
        await homePage.goto()
        await homePage.clickGameCard('words')

        await expect(page).toHaveURL('/words')
    })

    test('switches language and preserves the selection on reload', async ({ homePage, page }) => {
        await homePage.goto()

        await expect(page.locator('html')).toHaveAttribute('lang', 'en')
        await expect(page.locator('a[href="/numbers"]')).toContainText(en['games.numbers.title'])
        await homePage.switchLanguage('ES')
        await expect(page.locator('html')).toHaveAttribute('lang', 'es')
        await expect(page.locator('a[href="/numbers"]')).toContainText(es['games.numbers.title'])
        await page.reload()
        await expect(page.locator('html')).toHaveAttribute('lang', 'es')
        await expect(page.locator('a[href="/numbers"]')).toContainText(es['games.numbers.title'])
    })
})
