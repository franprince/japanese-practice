import { defineConfig, devices } from '@playwright/test'

const port = 3100
const baseURL = `http://127.0.0.1:${port}`

/**
 * Playwright configuration for E2E testing
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './e2e',

    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    failOnFlakyTests: !!process.env.CI,

    /* Opt out of parallel tests on CI */
    workers: process.env.CI ? 1 : 2,

    /* Reporter to use */
    reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

    /* Shared settings for all the projects below */
    use: {
        /* Base URL to use in actions like `await page.goto('/')` */
        baseURL,
        locale: 'en-US',
        serviceWorkers: 'block',

        /* Retain trace and screenshot evidence only on failure */
        trace: 'retain-on-failure',

        screenshot: 'only-on-failure',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /* Build and run an isolated production server */
    webServer: {
        command: `${process.env.E2E_SKIP_BUILD === '1' ? '' : 'bun run build && '}bun run start --hostname 127.0.0.1 --port ${port}`,
        url: `${baseURL}/api/health`,
        reuseExistingServer: false,
        timeout: 120 * 1000,
    },
})
