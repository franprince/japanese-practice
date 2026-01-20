import { test, expect } from '@playwright/test'

test.describe('Performance (INP Proxy)', () => {

    test('desktop input latency should be under 400ms', async ({ page }) => {
        await page.goto('/words')
        await page.waitForLoadState('networkidle')

        const input = page.locator('input[type="text"]')
        await expect(input).toBeVisible()

        // Measure typing latency
        const start = Date.now()
        await input.focus()
        await page.keyboard.type('a')
        // We wait for the value to actually appear in the DOM
        await page.waitForFunction(() => {
            const el = document.querySelector('input[type="text"]') as HTMLInputElement
            return el.value === 'a' || el.value.endsWith('a')
        })
        const end = Date.now()
        const latency = end - start

        console.log(`Desktop Input Latency: ${latency}ms`)
        expect(latency).toBeLessThan(400)
    })

    test('mobile input latency should be under 400ms', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 })
        await page.goto('/words')
        await page.waitForLoadState('networkidle')

        const input = page.locator('input[type="text"]')
        await expect(input).toBeVisible()

        // Measure typing latency
        const start = Date.now()
        await input.focus()
        await page.keyboard.type('b')
        await page.waitForFunction(() => {
            const el = document.querySelector('input[type="text"]') as HTMLInputElement
            return el.value === 'b' || el.value.endsWith('b')
        })
        const end = Date.now()
        const latency = end - start

        console.log(`Mobile Input Latency: ${latency}ms`)
        // Mobile emulation in Playwright might be slightly slower due to overhead, but 400ms is generous
        expect(latency).toBeLessThan(400)
    })
})
