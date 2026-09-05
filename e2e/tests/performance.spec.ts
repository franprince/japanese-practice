import { test, expect } from '../fixtures'
import { mockWordset } from '../fixtures/practice'

// Runner timings include automation overhead and are diagnostic, not INP metrics.
for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    test(`input, feedback and next-question readiness at ${viewport.width}px`, async ({ page }, testInfo) => {
        await page.setViewportSize(viewport)
        await mockWordset(page)
        await page.goto('/words')
        const input = page.getByRole('textbox')
        await expect(input).toBeEditable()
        const observations: Record<string, number> = {}
        let start = performance.now()
        await input.fill('wronganswer')
        await expect(input).toHaveValue('wronganswer')
        observations.input = performance.now() - start
        start = performance.now()
        await input.press('Enter')
        await expect(input).toHaveAttribute('readonly', '')
        await expect(input).toHaveClass(/border-destructive/)
        observations.feedback = performance.now() - start
        start = performance.now()
        await page.getByRole('button', { name: 'Next Word', exact: true }).click()
        await expect(input).toBeEditable()
        await expect(input).toHaveValue('')
        // Random generation is allowed to choose the same word twice.
        await expect(page.getByTestId('question-display')).not.toBeEmpty()
        observations.next = performance.now() - start
        await testInfo.attach('runner-interaction-durations-ms', {
            body: JSON.stringify(observations, null, 2), contentType: 'application/json',
        })
    })
}
