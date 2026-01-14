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

    async screenshot(name: string) {
        // Capture screenshot as buffer only
        const buffer = await this.page.screenshot({ fullPage: true })

        // Attach buffer to test report
        await base.info().attach(name, {
            body: buffer,
            contentType: 'image/png'
        })
    }
}
