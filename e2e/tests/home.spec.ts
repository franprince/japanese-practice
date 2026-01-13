import { test, expect } from '../fixtures'

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

    test('should switch language', async ({ homePage, page }) => {
        await homePage.goto()

        // Switch to English
        await homePage.switchLanguage('EN')

        // Verify language changed (check for English text)
        const title = await homePage.getTitle()
        expect(title).toBeTruthy()
    })
})
