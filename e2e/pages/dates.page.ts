import { type Page } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page Object Model for the Dates game page
 */
export class DatesPage extends BasePage {
    constructor(page: Page) {
        super(page)
    }

    override async goto() {
        await super.goto('/dates')
        await this.waitForPageLoad()
    }

    async selectMode(mode: 'week_days' | 'months') {
        const modeMap = {
            week_days: ['Week Days', 'Días de la Semana'],
            months: ['Months', 'Meses'],
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
