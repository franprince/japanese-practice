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
        // Sanitize name to be safe for filenames
        const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const screenshotPath = `test-results/screenshots/${safeName}.png`

        // Capture screenshot to both disk and buffer
        const buffer = await this.page.screenshot({ path: screenshotPath, fullPage: true })

        // Attach buffer to test report (fixes broken image links)
        await base.info().attach(name, {
            body: buffer,
            contentType: 'image/png'
        })
    }
}
