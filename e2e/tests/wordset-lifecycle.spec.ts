import { fixtureChecksum, fixtureManifest } from "../../src/test/wordset-fixture"
import { type Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { wordset, readWordset, selectWords, mockWordset, mockWordsetManifest } from '../fixtures/practice'

const cachedWordset = { ...wordset, assetChecksum: fixtureChecksum(wordset) }

async function openConsent(page: Page) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/words')
    await expect(page.getByRole('textbox')).toBeEditable()
    await selectWords(page)
    await expect(page.getByTestId('mobile-wordset-modal')).toBeVisible()
}
const confirmation = (page: Page, lang = 'en') =>
    page.evaluate(language => localStorage.getItem(`wordset-confirmed-${language}`), lang)

for (const fault of [
    { name: 'HTTP', status: 503, body: 'unavailable', message: 'unavailable' },
    { name: 'JSON', status: 200, body: '{', message: 'could not be read' },
    { name: 'schema', status: 200, body: '{"error":"invalid"}', message: 'invalid' },
]) {
    test(`mobile ${fault.name} failure does not confirm or persist; retry saves a usable wordset`, async ({ page }, testInfo) => {
        let downloads = 0
        await page.route('**/wordsets/manifest.json', route => {
            const manifest = fixtureManifest(wordset)
            if (downloads === 0 && fault.status === 200) manifest.datasets.en.bytes = Buffer.byteLength(fault.body)
            return route.fulfill({ json: manifest })
        })
        await page.route('**/wordsets/en-*.json', async route => {
            downloads++
            await route.fulfill(downloads === 1 ? fault : { json: wordset })
        })
        await openConsent(page)
        expect(downloads).toBe(0)
        const modal = page.getByTestId('mobile-wordset-modal')
        await modal.getByRole('button', { name: 'Download', exact: true }).click()
        await expect(modal.getByRole('alert')).toContainText(fault.message)
        expect(await confirmation(page)).toBeNull()
        expect(await readWordset(page)).toBeNull()
        await testInfo.attach('download-failure', { body: await page.screenshot(), contentType: 'image/png' })
        await modal.getByRole('button', { name: 'Retry', exact: true }).click()
        await expect(modal).toBeHidden()
        await expect(page.getByTestId('question-display')).toHaveText('あいう')
        expect(await confirmation(page)).toBe('1')
        expect(await readWordset(page)).toEqual(cachedWordset)
        expect(downloads).toBe(2)
    })
}

test('mobile storage failure never confirms; cancel keeps character mode usable', async ({ page }) => {
    await page.addInitScript(() => {
        const original = IDBObjectStore.prototype.put
        IDBObjectStore.prototype.put = function (...args) {
            if (this.name === 'wordSets') throw new DOMException('Storage full', 'QuotaExceededError')
            return original.apply(this, args)
        }
    })
    await mockWordset(page)
    await openConsent(page)
    const modal = page.getByTestId('mobile-wordset-modal')
    await modal.getByRole('button', { name: 'Download', exact: true }).click()
    await expect(modal.getByRole('alert')).toContainText('Could not save')
    expect(await confirmation(page)).toBeNull()
    expect(await readWordset(page)).toBeNull()
    await modal.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(modal).toBeHidden()
    await expect(page.getByRole('textbox')).toBeEditable()
})

test('cancels a pending request and permits a fresh download', async ({ page }) => {
    await mockWordsetManifest(page)
    let downloads = 0
    await page.route('**/wordsets/en-*.json', async route => {
        downloads++
        if (downloads > 1) await route.fulfill({ json: wordset })
        // The first request remains intercepted until cancellation/context teardown.
    })
    await openConsent(page)
    const modal = page.getByTestId('mobile-wordset-modal')
    await modal.getByRole('button', { name: 'Download', exact: true }).click()
    await expect.poll(() => downloads).toBe(1)
    await expect(modal.getByRole('status')).toContainText('Downloading')
    await expect(modal.getByRole('status')).not.toContainText('100%')
    await expect(modal.getByRole('button', { name: 'Download', exact: true })).toBeDisabled()
    const cancelled = page.waitForEvent('requestfailed', request =>
        new URL(request.url()).pathname.startsWith('/wordsets/en-') && request.method() === 'GET')
    await modal.getByRole('button', { name: 'Cancel', exact: true }).click()
    expect((await cancelled).failure()?.errorText).toContain('ERR_ABORTED')
    await expect(modal).toBeHidden()
    expect(await confirmation(page)).toBeNull()
    expect(await readWordset(page)).toBeNull()
    await selectWords(page)
    await modal.getByRole('button', { name: 'Download', exact: true }).click()
    await expect(modal).toBeHidden()
    await expect(page.getByTestId('question-display')).toHaveText('あいう')
    expect(await readWordset(page)).toEqual(cachedWordset)
    expect(downloads).toBe(2)
})

test('reload reuses durable data despite a failed background version check', async ({ page }) => {
    let downloads = 0
    let metadataFailures = 0
    let failMetadata = false
    await page.route('**/wordsets/manifest.json', async route => {
        if (failMetadata) {
            metadataFailures++
            await route.fulfill({ status: 503 })
        } else await route.fulfill({ json: fixtureManifest(wordset) })
    })
    await page.route('**/wordsets/en-*.json', async route => {
        downloads++
        await route.fulfill({ json: wordset })
    })
    await openConsent(page)
    const modal = page.getByTestId('mobile-wordset-modal')
    await modal.getByRole('button', { name: 'Download', exact: true }).click()
    await expect(modal).toBeHidden()
    failMetadata = true
    await page.reload()
    await expect.poll(() => metadataFailures).toBeGreaterThan(0)
    await selectWords(page)
    await expect(page.getByTestId('question-display')).toHaveText('あいう')
    await expect(modal).toBeHidden()
    expect(await readWordset(page)).toEqual(cachedWordset)
    expect(downloads).toBe(1)
})

test('Japanese reuses English data; Spanish needs its own consent and durable entry', async ({ page }) => {
    await mockWordsetManifest(page)
    const downloads: string[] = []
    await page.route('**/wordsets/*-*.json', async route => {
        downloads.push(new URL(route.request().url()).pathname.split('/').at(-1)!.slice(0, 2))
        await route.fulfill({ json: wordset })
    })
    await openConsent(page)
    const modal = page.getByTestId('mobile-wordset-modal')
    await modal.getByRole('button', { name: 'Download', exact: true }).click()
    await expect(modal).toBeHidden()
    await page.getByRole('button', { name: 'JA', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
    await expect(page.getByTestId('question-display')).toHaveText('あいう')
    await expect(modal).toBeHidden()
    expect(downloads).toEqual(['en'])
    await page.getByRole('button', { name: 'ES', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(modal).toBeVisible()
    expect(await confirmation(page, 'es')).toBeNull()
    expect(await readWordset(page, 'es')).toBeNull()
    await modal.getByRole('button', { name: 'Descargar', exact: true }).click()
    await expect(modal).toBeHidden()
    await expect(page.getByTestId('question-display')).toHaveText('あいう')
    expect(downloads).toEqual(['en', 'es'])
    expect(await readWordset(page, 'en')).toEqual(cachedWordset)
    expect(await readWordset(page, 'es')).toEqual(cachedWordset)
    expect(await confirmation(page, 'es')).toBe('1')
})
