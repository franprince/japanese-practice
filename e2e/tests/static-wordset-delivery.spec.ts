import { test, expect } from "@playwright/test"
import { validateManifest } from "../../src/lib/japanese/words/manifest"

for (const language of ["en", "es"]) {
    test(`${language} static download persists and a repeat visit only checks metadata`, async ({ page }) => {
        await page.addInitScript(lang => localStorage.setItem("kana-words-lang", lang), language)
        const assets: string[] = []
        let manifests = 0
        page.on("request", request => {
            const url = new URL(request.url())
            if (/\/wordsets\/(en|es)-[a-f0-9]{64}\.json$/.test(url.pathname)) assets.push(url.pathname)
            if (url.pathname === "/wordsets/manifest.json") manifests++
        })
        await page.goto("/words")
        await expect(page.getByTestId("question-display")).not.toHaveText("", { timeout: 30000 })
        await expect.poll(async () => page.evaluate(lang => new Promise(resolve => {
            const open = indexedDB.open("kana-words", 3)
            open.onerror = () => resolve(false)
            open.onsuccess = () => {
                const db = open.result
                const tx = db.transaction("wordSets", "readonly")
                const read = tx.objectStore("wordSets").get(`prod-${lang}`)
                tx.oncomplete = () => { resolve(typeof read.result?.assetChecksum === "string"); db.close() }
                tx.onerror = () => { resolve(false); db.close() }
            }
        }), language), { timeout: 30000 }).toBe(true)
        expect(assets).toHaveLength(1)
        expect(assets[0]).toContain(`/wordsets/${language}-`)
        const previous = manifests
        await page.reload()
        await expect.poll(() => manifests).toBeGreaterThan(previous)
        await page.waitForLoadState("networkidle")
        expect(assets).toHaveLength(1)
    })
}

test("manifest revalidates and hashed payloads have immutable caching", async ({ request }) => {
    const response = await request.get("/wordsets/manifest.json")
    expect(response.ok()).toBe(true)
    expect(response.headers()["cache-control"]).toBe("no-cache")
    const manifest = validateManifest(await response.json())
    const etag = response.headers().etag
    expect(etag).toBeTruthy()
    const unchanged = await request.get("/wordsets/manifest.json", { headers: { "If-None-Match": etag! } })
    expect(unchanged.status()).toBe(304)
    for (const entry of Object.values(manifest.datasets)) {
        const asset = await request.head(entry.url)
        expect(asset.ok()).toBe(true)
        expect(asset.headers()["cache-control"]).toBe("public, max-age=31536000, immutable")
        expect(Number(asset.headers()["content-length"])).toBe(entry.bytes)
    }
    expect((await request.get(`/wordsets/en-${"0".repeat(64)}.json`)).status()).toBe(404)
    expect((await request.get("/api/wordset?lang=en")).status()).toBe(404)
})
