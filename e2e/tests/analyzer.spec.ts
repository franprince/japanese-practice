import { test, expect } from '../fixtures'

const SENTENCE = '私は昨日、図書館で日本語の本を読んでいました。'

test.describe('Text Analyzer', () => {
    for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 812 }]) {
        test(`lines up words with and without furigana at ${viewport.width}px`, async ({ page }) => {
            await page.setViewportSize(viewport)
            await page.goto(`/analyzer?q=${encodeURIComponent(SENTENCE)}`)
            const reading = page.locator('p[lang="ja"]').filter({ has: page.locator('ruby') })
            await expect(reading.locator('ruby').first()).toBeVisible({ timeout: 30_000 })
            await page.evaluate(() => document.fonts.ready)

            // Words with a reading over them (私, 昨日) and without (は, で, 、) share one line of text
            // and one row of romaji, wherever the line wraps.
            const lines = await reading.evaluate((p) => {
                const half = (n: number) => Math.round(n * 2) / 2
                // The top of a word's own text, leaving out the reading above it.
                const textTop = (el: Element) => {
                    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
                        acceptNode: (n) => (n.parentElement?.closest('rt, rp') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
                    })
                    const range = document.createRange()
                    range.selectNodeContents(walker.nextNode()!)
                    return half(range.getBoundingClientRect().top)
                }
                const lines: { top: number; text: Set<number>; romaji: Set<number> }[] = []
                for (const el of Array.from(p.children)) {
                    if (!el.textContent?.trim()) continue
                    const top = el.getBoundingClientRect().top
                    let line = lines.at(-1)
                    if (!line || top - line.top > 20) lines.push((line = { top, text: new Set(), romaji: new Set() }))
                    const word = el.tagName === 'BUTTON'
                    line.text.add(textTop(word ? el.children[0]! : el))
                    if (word && el.children[1]) line.romaji.add(half(el.children[1].getBoundingClientRect().top))
                }
                return lines.map((l) => ({ text: [...l.text], romaji: [...l.romaji] }))
            })

            expect(lines.length).toBeGreaterThan(0)
            for (const line of lines) {
                expect(line.text).toHaveLength(1)
                expect(line.romaji).toHaveLength(1)
            }
        })
    }
})
