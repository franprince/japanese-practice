import { type Page } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page Object Model for the Home page
 */
export class HomePage extends BasePage {
    constructor(page: Page) {
        super(page)
    }

    override async goto() {
        await super.goto('/')
        await this.waitForPageLoad()
    }

    async getTitle() {
        return await this.page.textContent('h1')
    }

    async clickGameCard(gameName: 'words' | 'kanji' | 'numbers' | 'dates') {
        await this.page.click(`a[href="/${gameName}"]`)
    }

    async switchLanguage(lang: 'EN' | 'JA' | 'ES') {
        await this.page.click(`button:has-text("${lang}")`)
    }

    async getGameCards() {
        // Game cards are links with href to game pages
        return await this.page.locator('a[href^="/"][href$="words"], a[href^="/"][href$="kanji"], a[href^="/"][href$="numbers"], a[href^="/"][href$="dates"]').all()
    }
}
