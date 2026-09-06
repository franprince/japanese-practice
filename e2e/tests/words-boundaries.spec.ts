import path from 'node:path'
import { test, expect } from '../fixtures'
import { mockWordset, selectWords } from '../fixtures/practice'

for (const [device, viewport] of [
    ['desktop', { width: 1280, height: 1000 }],
    ['mobile', { width: 390, height: 844 }],
] as const) {
    test(`${device} settings keep a draft across game-type changes and cancel preserves input`, async ({ page }, testInfo) => {
        await page.setViewportSize(viewport)
        await mockWordset(page)
        await page.goto('/words')
        if (device === 'mobile') {
            await selectWords(page)
            const consent = page.getByTestId('mobile-wordset-modal')
            await expect(consent).toBeVisible()
            await consent.getByRole('button', { name: 'Download', exact: true }).click()
            await expect(consent).toBeHidden()
        }
        await expect(page.getByTestId('question-display')).toHaveText('あいう')
        const input = page.getByRole('textbox')
        await input.fill('partial')
        const capture = async (state: string) => {
            const name = `words-${device}-${state}`
            const proofDir = process.env.WORDS_PROOF_DIR
            const body = await page.screenshot({
                fullPage: true, animations: 'disabled',
                ...(proofDir ? { path: path.join(proofDir, `${name}.png`) } : {}),
            })
            await testInfo.attach(name, { body, contentType: 'image/png' })
        }
        await capture('gameplay')
        const open = page.getByTestId('settings-trigger')
        await open.click()
        const dialog = page.getByRole('dialog', { name: 'Practice Settings', exact: true })
        await expect(dialog).toBeVisible()
        await capture('settings')
        await dialog.getByRole('button', { name: /Custom/ }).click()
        await dialog.getByRole('button', { name: 'Deselect all', exact: true }).click()
        const save = dialog.getByRole('button', { name: 'Save Settings', exact: true })
        await expect(save).toBeDisabled()
        await dialog.getByRole('button', { name: 'Guess the Char Multiple choice', exact: true }).click()
        await expect(dialog.getByRole('button', { name: 'Any', exact: true })).toBeHidden()
        await expect(save).toBeDisabled()
        await dialog.getByRole('button', { name: 'Words Vocabulary practice', exact: true }).click()
        await expect(dialog.getByRole('button', { name: 'Any', exact: true })).toBeVisible()
        await expect(save).toBeDisabled()
        await dialog.getByRole('button', { name: 'Select all', exact: true }).click()
        await expect(save).toBeEnabled()
        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
        await expect(input).toHaveValue('partial')
        await expect(page.getByTestId('question-display')).toHaveText('あいう')
    })
}
