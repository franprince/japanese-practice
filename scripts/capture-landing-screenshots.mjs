// Captures the product screenshots shown on the home page, public/landing/<screen>-<language>.webp,
// from a running production build, in every UI language, at a phone's width and twice its pixels:
//   bun run build && bun run start --hostname 127.0.0.1 --port 3100
//   node scripts/capture-landing-screenshots.mjs        (BASE_URL defaults to http://127.0.0.1:3100)
// Each screen is a real session caught mid-use: an answer just checked, a number being keyed in,
// a sentence analyzed.
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import { toRomaji } from 'wanakana'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'landing')
const base = process.env.BASE_URL ?? 'http://127.0.0.1:3100'
const LANGUAGES = (process.env.LANGUAGES ?? 'en,es,ja').split(',')
const WIDTH = 414
// CSS pixels from the top of each screen's card: enough for the game card or the analyzer's input
// and reading, the same for all three so they line up on the page. What follows the screen's last
// card is hidden, leaving grid paper below it rather than the edge of the next block.
const HEIGHT = 540
const SENTENCE = '私は昨日、図書館で日本語の本を読んでいました。'

const DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']
/** 2024 → 二千二十四, as the numbers challenge expects it. */
function toKanji(n) {
  if (n === 0) return DIGITS[0]
  let kanji = ''
  for (const [value, mark] of [[10000, '万'], [1000, '千'], [100, '百'], [10, '十']]) {
    const count = Math.floor(n / value)
    n %= value
    if (count) kanji += (count === 1 && value < 10000 ? '' : toKanji(count)) + mark
  }
  return kanji + (n ? DIGITS[n] : '')
}

const SCREENS = {
  // A rōmaji answer just checked: the 正 stamp, and the first cell of the session filled in.
  romaji: {
    path: '/words',
    card: 'main .ink-card:has(.genko-cell)',
    async use(page) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const kana = (await page.locator('main .genko-cell').allTextContents()).join('')
        await page.getByRole('textbox').fill(toRomaji(kana))
        await page.keyboard.press('Enter')
        if (await page.locator('main .hanko').waitFor({ timeout: 3000 }).then(() => true, () => false)) return
        await page.reload()
      }
      throw new Error('no rōmaji answer was accepted')
    },
  },
  // A number keyed in with the kanji pad, before it is checked.
  numbers: {
    path: '/numbers',
    card: 'main .ink-card:has(.pad-key)',
    async use(page) {
      const figure = Number((await page.locator('main .font-hand.text-6xl').first().textContent()).replace(/\D/g, ''))
      for (const kanji of toKanji(figure)) await page.getByRole('button', { name: kanji, exact: true }).click()
    },
  },
  // A sentence with its furigana and rōmaji.
  analyzer: {
    path: `/analyzer?q=${encodeURIComponent(SENTENCE)}`,
    card: 'main section.ink-card:has(textarea)',
    last: 'main section.ink-card:has(ruby)',
    async use(page) {
      await page.locator('p[lang="ja"] ruby').first().waitFor({ timeout: 30_000 })
    },
  },
}

mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
try {
  for (const language of LANGUAGES) {
    const context = await browser.newContext({ viewport: { width: WIDTH, height: 844 }, deviceScaleFactor: 2, locale: language })
    await context.addInitScript((lang) => localStorage.setItem('kana-words-lang', lang), language)
    const page = await context.newPage()
    for (const [name, screen] of Object.entries(SCREENS)) {
      // A cold page now and then never shows its card; a second load does.
      for (let attempt = 1; ; attempt++) {
        await page.goto(`${base}${screen.path}`)
        try {
          await page.locator(screen.card).first().waitFor({ timeout: 15_000 })
          await screen.use(page)
          break
        } catch (error) {
          if (attempt < 2) continue
          const debug = join(tmpdir(), `landing-${name}-${language}.png`)
          await page.screenshot({ path: debug, fullPage: true })
          throw new Error(`${name} (${language}) at ${page.url()}, see ${debug}`, { cause: error })
        }
      }
      await page.locator(screen.last ?? screen.card).first().evaluate((last) => {
        for (const el of document.querySelectorAll('main *')) {
          if (last.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING && !last.contains(el)) el.style.visibility = 'hidden'
        }
      })
      await page.evaluate(() => document.fonts.ready)
      const box = await page.locator(screen.card).first().boundingBox()
      const top = Math.max(0, Math.round(box.y + (await page.evaluate(() => scrollY)) - 8))
      const png = await page.screenshot({ fullPage: true, clip: { x: 0, y: top, width: WIDTH, height: HEIGHT }, animations: 'disabled' })
      const file = join(out, `${name}-${language}.webp`)
      await sharp(png).webp({ quality: 90 }).toFile(file)
      console.log(`landing: ${file.slice(root.length + 1)}`)
    }
    await context.close()
  }
} finally {
  await browser.close()
}
