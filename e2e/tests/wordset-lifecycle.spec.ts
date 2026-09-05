import { test, expect, type Page } from "@playwright/test"

const wordset = {
    version: 1,
    hiraganaWords: [{ kana: "あいう", romaji: "aiu", type: "hiragana", groups: ["h1"] }],
    katakanaWords: [], bothForms: [],
}

async function openConsent(page: Page) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(() => localStorage.setItem("kana-words-lang", "en"))
    await page.goto("/words")
    await expect(page.locator('input[type="text"]')).toBeVisible()
    await page.getByRole("button", { name: "Command Center", exact: true }).click()
    await page.getByRole("button", { name: "Words Vocabulary practice", exact: true }).click()
    await page.getByRole("button", { name: /apply|save/i }).first().click()
    await expect(page.getByTestId("mobile-wordset-modal")).toBeVisible()
}

test("mobile HTTP failure stays open and retry confirms a readable cache", async ({ page }) => {
    let downloads = 0
    await page.route("**/api/wordset?lang=en", async route => {
        if (route.request().method() === "HEAD") {
            await route.fulfill({ status: 200 }); return
        }
        downloads++
        await route.fulfill(downloads === 1
            ? { status: 503, body: "unavailable" }
            : { status: 200, contentType: "application/json", body: JSON.stringify(wordset) })
    })
    await openConsent(page)
    expect(downloads).toBe(0)
    const modal = page.getByTestId("mobile-wordset-modal")
    await modal.getByRole("button", { name: "Download", exact: true }).click()
    await expect(modal.getByRole("alert")).toContainText("unavailable")
    expect(await page.evaluate(() => localStorage.getItem("wordset-confirmed-en"))).toBeNull()
    await page.screenshot({ path: "test-results/wordset-download-error.png" })
    await modal.getByRole("button", { name: "Retry", exact: true }).click()
    await expect(modal).toBeHidden()
    expect(await page.evaluate(() => localStorage.getItem("wordset-confirmed-en"))).toBe("1")
    const saved = await page.evaluate(() => new Promise((resolve, reject) => {
        const open = indexedDB.open("kana-words", 3)
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
            const db = open.result
            const tx = db.transaction("wordSets", "readonly")
            const read = tx.objectStore("wordSets").get("prod-en")
            tx.oncomplete = () => { resolve(read.result); db.close() }
            tx.onerror = () => { reject(tx.error); db.close() }
        }
    }))
    expect(saved).toEqual(wordset)
    expect(downloads).toBe(2)
})

test("mobile storage failure never confirms and cancel keeps character mode usable", async ({ page }) => {
    await page.addInitScript(() => {
        const original = IDBObjectStore.prototype.put
        IDBObjectStore.prototype.put = function (...args) {
            if (this.name === "wordSets") throw new DOMException("Storage full", "QuotaExceededError")
            return original.apply(this, args)
        }
    })
    await page.route("**/api/wordset?lang=en", route => route.fulfill({
        status: 200, contentType: "application/json",
        body: route.request().method() === "HEAD" ? "" : JSON.stringify(wordset),
    }))
    await openConsent(page)
    const modal = page.getByTestId("mobile-wordset-modal")
    await modal.getByRole("button", { name: "Download", exact: true }).click()
    await expect(modal.getByRole("alert")).toContainText("Could not save")
    expect(await page.evaluate(() => localStorage.getItem("wordset-confirmed-en"))).toBeNull()
    await modal.getByRole("button", { name: "Cancel", exact: true }).click()
    await expect(modal).toBeHidden()
    await expect(page.locator('input[type="text"]')).toBeVisible()
})

test("mobile cancellation during an unknown-length download does not show success", async ({ page }) => {
    await page.route("**/api/wordset?lang=en", async route => {
        if (route.request().method() === "HEAD") await route.fulfill({ status: 200 })
        // Keep GET pending until the user cancels; context teardown releases it.
    })
    await openConsent(page)
    const modal = page.getByTestId("mobile-wordset-modal")
    await modal.getByRole("button", { name: "Download", exact: true }).click()
    await expect(modal.getByRole("status")).toContainText("Downloading")
    await expect(modal.getByRole("status")).not.toContainText("100%")
    await modal.getByRole("button", { name: "Cancel", exact: true }).click()
    await expect(modal).toBeHidden()
    expect(await page.evaluate(() => localStorage.getItem("wordset-confirmed-en"))).toBeNull()
    await expect(page.locator('input[type="text"]')).toBeVisible()
})
