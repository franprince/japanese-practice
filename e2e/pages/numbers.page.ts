import { type Page } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page Object Model for the Numbers game page
 */
export class NumbersPage extends BasePage {
    constructor(page: Page) {
        super(page)
    }

    override async goto() {
        await super.goto('/numbers')
        await this.waitForPageLoad()
    }

    async selectDifficulty(difficulty: 'easy' | 'medium' | 'hard') {
        const difficultyMap = {
            easy: ['Easy', 'Fácil'],
            medium: ['Medium', 'Medio'],
            hard: ['Hard', 'Difícil'],
        }
        const labels = difficultyMap[difficulty]
        await this.page.click(`button:has-text("${labels[0]}"), button:has-text("${labels[1]}")`)
    }

    async selectMode(mode: 'arabicToKanji' | 'kanjiToArabic') {
        const modeMap = {
            arabicToKanji: ['Arabic to Kanji', 'Arábigo a Kanji'],
            kanjiToArabic: ['Kanji to Arabic', 'Kanji a Arábigo'],
        }
        const labels = modeMap[mode]
        await this.page.click(`button:has-text("${labels[0]}"), button:has-text("${labels[1]}")`)
    }

    async typeAnswer(answer: string) {
        await this.page.fill('input[type="text"]', answer)
    }

    async submitAnswer() {
        await this.page.click('button:has-text("Check"), button:has-text("Verificar")')
    }

    async skipQuestion() {
        await this.page.click('button:has-text("Skip"), button:has-text("Saltar")')
    }

    async getScore() {
        return await this.page.textContent('[data-testid="stats-display"]')
    }
}
