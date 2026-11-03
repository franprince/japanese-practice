// Captures the product screens on the home page's practice cards and analyzer card,
// public/landing/<screen>[-<language>].webp, from a running production build:
//   bun run build && bun run start --hostname 127.0.0.1 --port 3100
//   node scripts/capture-landing-screenshots.mjs        (BASE_URL defaults to http://127.0.0.1:3100;
//                                                        LANGUAGES=es,ja and SCREENS=numbers narrow it)
// Each is a crop of a real session caught mid-use: just the question and the answer given, at a
// phone's width and twice its pixels, set on plain paper (no grid, no card around it) and padded
// to 16:9 so it fills the top of its card. Screens with UI text get one image per language.
import { mkdirSync, readdirSync, readFileSync } from 'node:fs'
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
const ONLY = process.env.SCREENS?.split(',')
const WIDTH = 414
const PADDING = 24
const SIZE = { width: 960, height: 540 }
const SENTENCE = '図書館で日本語の本を読みます。'
const ATTEMPTS = 20

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

const WEEKDAYS = { 'day.sunday': 'にちようび', 'day.monday': 'げつようび', 'day.tuesday': 'かようび', 'day.wednesday': 'すいようび', 'day.thursday': 'もくようび', 'day.friday': 'きんようび', 'day.saturday': 'どようび' }
const locales = Object.fromEntries(LANGUAGES.map((language) => [language, JSON.parse(readFileSync(join(root, 'src', 'locales', `${language}.json`), 'utf8'))]))
const kanjiEntries = new Map(readdirSync(join(root, 'public')).filter((file) => /^kanji-n\d\.json$/.test(file))
  .flatMap((file) => JSON.parse(readFileSync(join(root, 'public', file), 'utf8')).map((entry) => [entry.char, entry])))
const settings = (rest) => JSON.stringify({ version: 1, playMode: 'session', targetCount: 10, ...rest })

/** Loads the screen's page or reloads it, up to its first question. */
async function load(page, screen, language, reload = false) {
  if (reload) await page.reload()
  else await page.goto(`${base}${screen.path}`)
  await screen.prepare?.(page, language)
  await page.locator(screen.ready).first().waitFor({ timeout: 30_000 })
}

/** Reloads until `suits` holds for the question on screen, then answers it. */
async function untilQuestion(page, screen, language, suits, answer) {
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    if (await suits()) {
      await answer()
      return
    }
    await load(page, screen, language, true)
  }
  throw new Error('no suitable question came up')
}

const SCREENS = {
  // A short word read from its kana and answered in rōmaji, marked correct.
  romaji: {
    path: '/words',
    settings: ['words', settings({ mode: 'hiragana', gameType: 'words', filter: null })],
    perLanguage: true,
    ready: '[data-testid="question-display"]',
    // On a phone, words mode asks before downloading its vocabulary.
    async prepare(page, language) {
      const download = page.getByRole('button', { name: locales[language]['common.download'], exact: true })
      if (!await download.waitFor({ timeout: 5000 }).then(() => true, () => false)) return
      await download.click()
      await download.waitFor({ state: 'hidden', timeout: 120_000 })
      await page.reload()
    },
    async use(page, language) {
      const kana = async () => (await page.getByTestId('question-display').textContent()).trim()
      await untilQuestion(page, this, language, async () => { const k = await kana(); return k.length <= 4 && /^[a-z]+$/.test(toRomaji(k)) }, async () => {
        await page.locator('main input').first().fill(toRomaji(await kana()))
        await page.keyboard.press('Enter')
        await page.locator('main .hanko').waitFor({ timeout: 5000 })
      })
    },
    crop: () => [document.querySelector('[data-testid="question-display"]'), document.querySelector('main input').parentElement],
  },
  // A two-digit figure keyed in with the kanji pad, above the pad's first row.
  numbers: {
    path: '/numbers',
    settings: ['numbers', settings({ difficulty: 'medium', mode: 'arabicToKanji' })],
    ready: '#number-pad',
    async use(page, language) {
      const figure = async () => Number((await page.getByTestId('question-display').textContent()).replace(/\D/g, ''))
      await untilQuestion(page, this, language, async () => { const n = await figure(); return n > 20 && n % 10 !== 0 }, async () => {
        for (const kanji of toKanji(await figure())) await page.locator('#number-pad').getByRole('button', { name: kanji, exact: true }).click()
      })
    },
    crop: () => [document.querySelector('[data-testid="question-display"]'), document.querySelector('main .notebook-answer-line'), ...[...document.querySelectorAll('#number-pad > *')].slice(0, 5)],
  },
  // A kanji and its reading, picked from the options and marked correct. The script waits for a
  // question whose right answer is the first option, with a meaning short enough to read small.
  kanji: {
    path: '/kanji',
    perLanguage: true,
    ready: 'main .choice-card',
    async use(page, language) {
      const options = page.locator('main .choice-card')
      await untilQuestion(page, this, language, async () => {
        const entry = kanjiEntries.get((await page.getByTestId('question-display').textContent()).trim())
        return entry !== undefined && Math.max(entry.meaning_en?.length ?? 0, entry.meaning_es?.length ?? 0) <= 16
          && (await options.first().locator('span[lang="ja"]').first().textContent()).trim() === entry.reading
      }, async () => {
        await options.first().click()
        await page.locator('main .choice-card[data-result="correct"]').waitFor({ timeout: 5000 })
      })
    },
    crop: () => [document.querySelector('[data-testid="question-display"]'), document.querySelector('main .choice-card')],
  },
  // A weekday, shown in the UI language, with its reading typed in hiragana. (Once checked, the
  // field greys out and reads like a placeholder.)
  dates: {
    path: '/dates',
    settings: ['dates', settings({ mode: 'week_days' })],
    perLanguage: true,
    ready: '[data-testid="question-display"]',
    async use(page, language) {
      const day = (await page.getByTestId('question-display').textContent()).trim()
      const reading = Object.entries(WEEKDAYS).find(([key]) => locales[language][key] === day)?.[1]
      if (!reading) throw new Error(`no reading for the weekday ${day}`)
      await page.locator('#date-answer').fill(reading)
    },
    crop: () => [document.querySelector('[data-testid="question-display"]'), document.querySelector('#date-answer').parentElement],
  },
  // A sentence with its furigana and rōmaji.
  analyzer: {
    path: `/analyzer?q=${encodeURIComponent(SENTENCE)}`,
    ready: 'main section.ink-card p[lang="ja"] ruby',
    async use() {},
    // The words themselves rather than their paragraph, which spans the card's width.
    crop: () => [...document.querySelectorAll('main section.ink-card p[lang="ja"] > *')],
  },
}

mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
try {
  for (const [index, language] of LANGUAGES.entries()) {
    for (const [name, screen] of Object.entries(SCREENS)) {
      if ((ONLY && !ONLY.includes(name)) || (!screen.perLanguage && index > 0)) continue
      const context = await browser.newContext({ viewport: { width: WIDTH, height: 844 }, deviceScaleFactor: 2, locale: language })
      await context.addInitScript(([lang, setting]) => {
        localStorage.setItem('kana-words-lang', lang)
        if (setting) localStorage.setItem(`practice-settings-${setting[0]}-v1`, setting[1])
      }, [language, screen.settings])
      const page = await context.newPage()
      // A cold page now and then never shows its question; a second load does.
      for (let attempt = 1; ; attempt++) {
        try {
          await load(page, screen, language)
          await screen.use(page, language)
          break
        } catch (error) {
          if (attempt < 2) continue
          const debug = join(tmpdir(), `landing-${name}-${language}.png`)
          await page.screenshot({ path: debug, fullPage: true })
          throw new Error(`${name} (${language}) at ${page.url()}, see ${debug}`, { cause: error })
        }
      }
      await page.evaluate(() => document.fonts.ready)
      // Only the cropped elements stay: whatever else is in the page goes, so the crop's edges
      // catch no neighbours and the elements close up, and they sit on plain paper (no grid, no
      // card frame around them).
      const paper = await page.evaluate(() => {
        document.body.style.backgroundImage = 'none'
        for (const card of document.querySelectorAll('main .ink-card')) Object.assign(card.style, { background: 'transparent', borderColor: 'transparent', boxShadow: 'none', backdropFilter: 'none', padding: '0' })
        return getComputedStyle(document.body).backgroundColor
      })
      const rects = await page.evaluate(`(() => {
        const keep = (${screen.crop})()
        for (const el of document.querySelectorAll('main *')) if (!keep.some((k) => k.contains(el) || el.contains(k))) el.style.display = 'none'
        return keep.map((el) => { const r = el.getBoundingClientRect(); return [r.left + scrollX, r.top + scrollY, r.right + scrollX, r.bottom + scrollY] })
      })()`)
      const x = Math.max(0, Math.min(...rects.map((r) => r[0])) - PADDING)
      const y = Math.max(0, Math.min(...rects.map((r) => r[1])) - PADDING)
      const clip = { x, y, width: Math.min(WIDTH, Math.max(...rects.map((r) => r[2])) + PADDING) - x, height: Math.max(...rects.map((r) => r[3])) + PADDING - y }
      const png = await page.screenshot({ fullPage: true, clip, animations: 'disabled' })
      // Pad to 16:9 around the crop in the paper's colour, then scale (sharp resizes before it
      // extends within one pipeline, hence two).
      const { width, height } = await sharp(png).metadata()
      const padX = Math.max(0, Math.ceil(height * 16 / 9) - width)
      const padY = Math.max(0, Math.ceil(width * 9 / 16) - height)
      const padded = await sharp(png).extend({ left: Math.floor(padX / 2), right: Math.ceil(padX / 2), top: Math.floor(padY / 2), bottom: Math.ceil(padY / 2), background: paper }).toBuffer()
      const file = join(out, `${name}${screen.perLanguage ? `-${language}` : ''}.webp`)
      await sharp(padded).resize(SIZE.width, SIZE.height).webp({ quality: 88 }).toFile(file)
      console.log(`landing: ${file.slice(root.length + 1)}`)
      await context.close()
    }
  }
} finally {
  await browser.close()
}
