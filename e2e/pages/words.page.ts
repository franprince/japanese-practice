import { type Page } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page Object Model for the Words game page
 */
export class WordsPage extends BasePage {
    constructor(page: Page) {
        super(page)
    }

    override async goto() {
        await super.goto('/words')
        await this.waitForPageLoad()
    }

    async selectMode(mode: 'hiragana' | 'katakana' | 'both' | 'custom') {
        await this.page.click(`button[data-testid="mode-${mode}"]`)
    }

    async getCurrentWord() {
        return await this.page.textContent('[data-testid="current-word"]')
    }

    async typeAnswer(answer: string) {
        await this.page.fill('input[type="text"]', answer)
    }

    async submitAnswer() {
        await this.page.click('button:has-text("Check")')
    }

    async clickNext() {
        await this.page.click('button:has-text("Next")')
    }

    async getFeedback() {
        const correctIcon = await this.page.locator('svg.lucide-check').isVisible()
        const incorrectIcon = await this.page.locator('svg.lucide-x').isVisible()

        if (correctIcon) return 'correct'
        if (incorrectIcon) return 'incorrect'
        return null
    }

    async getScore() {
        return await this.page.textContent('[data-testid="stats-display"]')
    }

    async skipWord() {
        await this.page.click('button:has-text("Skip")')
    }

    async toggleCharacterMode() {
        await this.page.click('button[title*="Character"]')
    }
}
