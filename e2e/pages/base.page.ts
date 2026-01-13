import { test as base, type Page } from '@playwright/test'

/**
 * Base page class with common utilities
 */
export class BasePage {
    constructor(public page: Page) { }

    async goto(path: string) {
        await this.page.goto(path)
    }

    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle')
    }
}
