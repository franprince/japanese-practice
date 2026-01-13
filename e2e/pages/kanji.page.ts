import { type Page } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page Object Model for the Kanji game page
 */
export class KanjiPage extends BasePage {
    constructor(page: Page) {
        super(page)
    }

    override async goto() {
        await super.goto('/kanji')
        await this.waitForPageLoad()
    }

    async selectDifficulty(difficulty: 'easy' | 'medium' | 'hard') {
        await this.page.click(`button:has-text("${difficulty}"), button:has-text("${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}")`)
    }

    async getCurrentKanji() {
        return await this.page.textContent('[data-testid="current-kanji"]')
    }

    async typeAnswer(answer: string) {
        await this.page.fill('input[type="text"]', answer)
    }

    async submitAnswer() {
        await this.page.click('button:has-text("Check")')
    }

    async skipKanji() {
        await this.page.click('button:has-text("Skip")')
    }

    async getScore() {
        return await this.page.textContent('[data-testid="stats-display"]')
    }
}
