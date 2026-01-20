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

        // Default is Character Mode on mobile, so input should be visible immediately
        // No download confirmation needed unless we switch to Words mode
        const input = page.locator('input[type="text"]')
        await expect(input).toBeVisible({ timeout: 10000 })

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

    test('check answer interaction latency should be under 400ms', async ({ page }) => {
        await page.goto('/words')
        await page.waitForLoadState('networkidle')

        const input = page.locator('input[type="text"]')
        await expect(input).toBeVisible()

        // Type a wrong answer
        await input.fill('wronganswer')

        // Measure time from clicking Check to seeing feedback
        const checkBtn = page.locator('button:has-text("Check"), button:has-text("Verificar"), button:has-text("Comprobar")')
        const start = Date.now()
        await checkBtn.first().click()

        // Wait for feedback to appear (border color change or feedback text)
        await page.waitForFunction(() => {
            const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement
            const computedStyle = window.getComputedStyle(inputEl)
            // Check if border changed to error color (indicates feedback rendered)
            return computedStyle.borderColor !== 'rgb(203, 213, 225)' // not the default border color
        }, { timeout: 5000 })

        const end = Date.now()
        const latency = end - start

        console.log(`Check Answer Latency: ${latency}ms`)
        expect(latency).toBeLessThan(400)
    })

    test('next word interaction latency should be under 400ms', async ({ page }) => {
        await page.goto('/words')
        await page.waitForLoadState('networkidle')

        const input = page.locator('input[type="text"]')
        await expect(input).toBeVisible()

        // Get initial word
        const initialWord = await page.locator('#word-question').textContent()

        // Type a correct answer (just skip for simplicity)
        await input.fill('test')
        const checkBtn = page.locator('button:has-text("Check"), button:has-text("Verificar"), button:has-text("Comprobar")')
        await checkBtn.first().click()

        // Wait for Next button to appear
        const nextBtn = page.locator('button:has-text("Next"), button:has-text("Siguiente")')
        await expect(nextBtn).toBeVisible()

        // Measure time from clicking Next to input being ready with new word
        const start = Date.now()
        await nextBtn.click()

        // Wait for new word to load and input to be focused
        await page.waitForFunction((prevWord) => {
            const wordEl = document.querySelector('#word-question')
            const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement
            return wordEl?.textContent !== prevWord && inputEl?.value === '' && document.activeElement === inputEl
        }, initialWord, { timeout: 5000 })

        const end = Date.now()
        const latency = end - start

        console.log(`Next Word Latency: ${latency}ms`)
        expect(latency).toBeLessThan(400)
    })

    test('mobile check answer interaction latency should be under 400ms', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 })
        await page.goto('/words')
        await page.waitForLoadState('networkidle')

        const input = page.locator('input[type="text"]')
        await expect(input).toBeVisible({ timeout: 10000 })

        // Type a wrong answer
        await input.fill('wronganswer')

        // Measure time from clicking Check to seeing feedback
        const checkBtn = page.locator('button:has-text("Check"), button:has-text("Verificar"), button:has-text("Comprobar")')
        const start = Date.now()
        await checkBtn.first().click()

        // Wait for feedback to appear
        await page.waitForFunction(() => {
            const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement
            const computedStyle = window.getComputedStyle(inputEl)
            return computedStyle.borderColor !== 'rgb(203, 213, 225)'
        }, { timeout: 5000 })

        const end = Date.now()
        const latency = end - start

        console.log(`Mobile Check Answer Latency: ${latency}ms`)
        expect(latency).toBeLessThan(400)
    })
})
