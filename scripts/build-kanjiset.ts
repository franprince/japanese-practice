import fs from "fs"
import path from "path"
// Playwright is optional; the fallback module will attempt to require it at runtime.

type JMDictEntry = {
  kanji?: { text: string }[]
  sense?: { gloss?: { text?: string }[] }[]
}

type KanjiSource = {
  rank?: string
  code_point_hex?: string
  char: string
  char_count?: string
  id?: number
}

const extractVersionNumber = (filename: string) => {
  const match = filename.match(/^kanjiset-v(\d+)\.json$/)
  if (!match) return null
  const num = Number.parseInt(match[1] ?? "", 10)
  return Number.isFinite(num) ? num : null
}

const resolveOutputPath = async (dataDir: string) => {
  const preferredVersion = process.env.KANJISET_VERSION
  const files: string[] = await fs.promises.readdir(dataDir).catch(() => [])
  const versions = files
    .map(extractVersionNumber)
    .filter((n): n is number => n !== null)
    .sort((a, b) => b - a)

  // If a preferred version is provided and not present, use it; otherwise bump from the max.
  if (preferredVersion) {
    const preferredPath = path.join(dataDir, `kanjiset-${preferredVersion}.json`)
    const preferredExists = files.includes(`kanjiset-${preferredVersion}.json`)
    if (!preferredExists) {
      return { outputPath: preferredPath, versionUsed: preferredVersion }
    }
  }

  const nextVersionNumber = (versions[0] ?? 0) + 1
  const nextVersion = `v${nextVersionNumber}`
  const outputPath = path.join(dataDir, `kanjiset-${nextVersion}.json`)
  return { outputPath, versionUsed: nextVersion }
}

const readJson = async (filePath: string) => JSON.parse(await fs.promises.readFile(filePath, "utf8"))

type JishoResult = { meaning: string | null; reading: string | null; jlpt: string | null }

const buildGlossLookup = (dict: { words?: JMDictEntry[]; default?: { words?: JMDictEntry[] } }) => {
  const entries = Array.isArray(dict?.default?.words) ? dict.default.words : dict.words ?? []
  const lookup: Record<string, string> = {}

  for (const entry of entries) {
    const gloss =
      entry?.sense?.find(s => Array.isArray(s.gloss) && s.gloss.length)?.gloss?.find(g => g?.text)?.text ?? null
    if (!gloss) continue

    const kanjiForms = (entry?.kanji ?? []).map(k => k.text).filter(Boolean)
    for (const form of kanjiForms) {
      if (!lookup[form]) {
        lookup[form] = gloss
      }
    }
  }

  return lookup
}

type KanjiRecord = {
  char: string
  meaning_en: string | null
  meaning_es: string | null
  reading: string | null
  jlpt: string | null
}

type FallbackModule = {
  name: string
  apply: (entry: KanjiRecord) => KanjiRecord | Promise<KanjiRecord>
}

const applyFallbacks = async (entry: KanjiRecord, modules: FallbackModule[]) => {
  let current = { ...entry }
  for (const module of modules) {
    current = await module.apply(current)
  }
  return current
}

const buildKanjiSet = async () => {
  const baseDir = process.cwd()
  const mostUsed: KanjiSource[] = JSON.parse(
    await fs.promises.readFile(path.join(baseDir, "data", "most_used_kanjis.json"), "utf8"),
  )

  const dataDir = path.join(baseDir, "public")
  const { outputPath, versionUsed } = await resolveOutputPath(dataDir)

  // If a previous dataset exists (any version), reuse its English meanings to avoid re-requesting
  const previousMeaningLookup: Record<string, string | null> = {}
  const previousReadingLookup: Record<string, string | null> = {}
  const previousJlptLookup: Record<string, string | null> = {}
  try {
    const files = await fs.promises.readdir(dataDir)
    const candidates = files.filter(f => /^kanjiset-.*\.json$/.test(f))
    // Prefer latest by lexicographic order (e.g., v2 > v1). Adjust if semantic versions are used.
    const latest = candidates.sort().reverse()[0]
    const target = latest ? path.join(dataDir, latest) : outputPath
    if (target && (await fs.promises.stat(target)).isFile()) {
      const prev = JSON.parse(await fs.promises.readFile(target, "utf8"))
      if (Array.isArray(prev)) {
        prev.forEach((entry: any) => {
          if (entry?.char) {
            if (entry?.meaning_en) previousMeaningLookup[entry.char] = entry.meaning_en
            if (entry?.reading) previousReadingLookup[entry.char] = entry.reading
            if (entry?.jlpt) previousJlptLookup[entry.char] = entry.jlpt
          }
        })
      }
    }
  } catch (err) {
    console.warn("Failed to read previous kanjiset file(s), continuing without reuse", err)
  }

  const engDict = await readJson(path.join(baseDir, "data", "jmdict-eng-3.6.2.json"))
  const spaDict = await readJson(path.join(baseDir, "data", "jmdict-spa-3.6.1.json"))

  const engLookup = buildGlossLookup(engDict)
  const spaLookup = buildGlossLookup(spaDict)



  // Fallback to Jisho API for missing English meanings
  const missingJishoChars = mostUsed
    .map(item => item.char)
    .filter(char => {
      const hasMeaning = engLookup[char] || previousMeaningLookup[char]
      return !hasMeaning
    })

  const fetchJishoMeaning = async (kanji: string): Promise<JishoResult> => {
    try {
      const res = await fetch(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(kanji)}`)
      if (!res.ok) return { meaning: null, reading: null, jlpt: null }
      const json = await res.json()
      const entries: any[] = Array.isArray(json?.data) ? json.data : []
      const exact = entries.find(e => Array.isArray(e?.japanese) && e.japanese.some((j: any) => j?.word === kanji))
      const selected = exact ?? entries[0]
      const senses = selected?.senses
      const defs = Array.isArray(senses?.[0]?.english_definitions) ? senses[0].english_definitions : []
      const meaning = defs.length ? defs.join(", ") : null
      const reading =
        Array.isArray(selected?.japanese) && selected.japanese.find((j: any) => j?.word === kanji)?.reading
          ? selected.japanese.find((j: any) => j.word === kanji).reading
          : Array.isArray(selected?.japanese) && selected.japanese[0]?.reading
            ? selected.japanese[0].reading
            : null
      const jlpt = Array.isArray(selected?.jlpt) && selected.jlpt.length ? selected.jlpt[0] : null
      return { meaning, reading, jlpt }
    } catch (err) {
      console.warn(`Jisho lookup failed for ${kanji}:`, err)
      return { meaning: null, reading: null, jlpt: null }
    }
  }

  const jishoMeanings: Record<string, string | null> = {}
  const jishoReadings: Record<string, string | null> = {}
  const jishoJlpt: Record<string, string | null> = {}
  const jishoErrors: string[] = []
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms))
  const throttleMs = 1000
  const jishoConcurrency = 3

  for (let i = 0; i < missingJishoChars.length; i += jishoConcurrency) {
    const batch = missingJishoChars.slice(i, i + jishoConcurrency)
    await Promise.all(
      batch.map(async kanji => {
        const result = await fetchJishoMeaning(kanji)
        if (result.meaning || result.reading || result.jlpt) {
          console.log(
            `Jisho ok: ${kanji} -> meaning: ${result.meaning ?? "—"} | reading: ${result.reading ?? "—"} | jlpt: ${result.jlpt ?? "—"}`,
          )
        } else {
          console.log(`Jisho miss: ${kanji}`)
          jishoErrors.push(kanji)
        }
        jishoMeanings[kanji] = result.meaning
        jishoReadings[kanji] = result.reading
        jishoJlpt[kanji] = result.jlpt
      }),
    )
    if (i + jishoConcurrency < missingJishoChars.length) {
      await delay(throttleMs)
    }
  }

  const fallbackStats = {
    base: 0,
    previous: 0,
    jisho: 0,
    playwrightRun: 0,
    playwrightSkipHasMeaning: 0,
    playwrightSkipNoPlaywright: 0,
    playwrightFailures: 0,
    playwrightResolved: 0,
    playwrightAttempted: 0,
  }
  const playwrightRecovered: string[] = []
  const playwrightTried: string[] = []

  const fallbackModules: FallbackModule[] = [
    {
      name: "previous-dataset",
      apply: (entry) => ({
        ...entry,
        meaning_en: entry.meaning_en ?? previousMeaningLookup[entry.char] ?? null,
        reading: entry.reading ?? previousReadingLookup[entry.char] ?? null,
        jlpt: entry.jlpt ?? previousJlptLookup[entry.char] ?? null,
      }),
    },
    {
      name: "base-dicts",
      apply: (entry) => ({
        ...entry,
        meaning_en: entry.meaning_en ?? engLookup[entry.char] ?? null,
        meaning_es: entry.meaning_es ?? spaLookup[entry.char] ?? null,
      }),
    },
    {
      name: "jisho-fetch",
      apply: (entry) => {
        const updated = {
          ...entry,
          meaning_en: entry.meaning_en ?? jishoMeanings[entry.char] ?? null,
          reading: entry.reading ?? jishoReadings[entry.char] ?? null,
          jlpt: entry.jlpt ?? jishoJlpt[entry.char] ?? null,
        }
        if (updated.meaning_en !== entry.meaning_en) {
          fallbackStats.jisho += 1
        }
        return updated
      },
    },
    {
      name: "playwright-scrape",
      apply: async (entry) => {
        if (entry.meaning_en) {
          fallbackStats.playwrightSkipHasMeaning += 1
          console.log(`[playwright] skip ${entry.char}: meaning already present`)
          return entry
        }

        let chromium: any
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          chromium = require("playwright").chromium
        } catch (err) {
          console.warn("Playwright not installed; skipping playwright-scrape fallback.")
          fallbackStats.playwrightSkipNoPlaywright += 1
          return entry
        }

        const url = `https://jisho.org/search/${encodeURIComponent(entry.char)}`
        let browser: any
        try {
          fallbackStats.playwrightRun += 1
          fallbackStats.playwrightAttempted += 1
          playwrightTried.push(entry.char)
          console.log(`[playwright] launch for ${entry.char} (${url})`)
          browser = await chromium.launch({ headless: true })
          const page = await browser.newPage()
          try {
            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 })
          } catch (navErr) {
            console.warn(`[playwright] navigation failed for ${entry.char} (${url}):`, navErr)
            fallbackStats.playwrightFailures += 1
            return entry
          }
          const extracted = await page.$$eval(
            ".meanings.english.sense",
            (nodes: Element[]) => nodes.map(n => n.textContent?.trim() ?? "").filter(Boolean),
          )
          const meaning = extracted[0] ?? null
          const jlptText = await page
            .$eval(".info.clearfix", (el: Element) => el.textContent ?? "")
            .then((text: string) => text || "")
            .catch(() => "")
          const jlptMatch = jlptText.match(/jlpt\s*n?\s*([1-5])/i)
          const jlptValue = jlptMatch ? `jlpt-n${jlptMatch[1]}`.toLowerCase() : null

          console.log(
            `[playwright] parsed ${entry.char} → meaning: ${meaning ?? "—"} | jlpt: ${jlptValue ?? "—"} | info: ${jlptText || "—"}`,
          )

          const resolvedMeaning = entry.meaning_en ?? meaning ?? null
          if (resolvedMeaning && !entry.meaning_en) {
            fallbackStats.playwrightResolved += 1
            playwrightRecovered.push(entry.char)
          }

          const updated = {
            ...entry,
            meaning_en: resolvedMeaning,
            jlpt: entry.jlpt ?? jlptValue ?? entry.jlpt ?? null,
          }
          return updated
        } catch (err) {
          console.warn(`Playwright scrape failed for ${entry.char} (${url}):`, err)
          fallbackStats.playwrightFailures += 1
          return entry
        } finally {
          if (browser) {
            await browser.close().catch(() => { })
          }
        }
      },
    },
  ]

  const payload: KanjiRecord[] = []
  for (const item of mostUsed) {
    const base: KanjiRecord = {
      char: item.char,
      meaning_en: null,
      meaning_es: null,
      reading: null,
      jlpt: null,
    }
    const completed = await applyFallbacks(base, fallbackModules)
    payload.push({
      ...item,
      ...completed,
    })
  }

  await fs.promises.writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8")
  const missingEn = payload.filter(p => !p.meaning_en).length
  const missingEs = payload.filter(p => !p.meaning_es).length
  const missingReading = payload.filter(p => !p.reading).length
  const missingJlpt = payload.filter(p => !p.jlpt).length
  console.log("\n=== Kanji Dataset Build ===")
  console.log(`Output: ${outputPath} (version: ${versionUsed})`)
  console.log(
    `Missing → en: ${missingEn} | es: ${missingEs} | reading: ${missingReading} | jlpt: ${missingJlpt}`,
  )
  console.log(
    `Fallbacks → jisho updates: ${fallbackStats.jisho} | playwright run: ${fallbackStats.playwrightRun} | ` +
    `playwright skipped (has meaning): ${fallbackStats.playwrightSkipHasMeaning} | ` +
    `playwright skipped (not installed): ${fallbackStats.playwrightSkipNoPlaywright} | ` +
    `playwright failures: ${fallbackStats.playwrightFailures}`,
  )
  if (jishoErrors.length) {
    console.log(`Jisho missing/failed (${jishoErrors.length}):`, jishoErrors.slice(0, 50).join(", "))
    if (jishoErrors.length > 50) {
      console.log(`...and ${jishoErrors.length - 50} more`)
    }
  } else {
    console.log("Jisho lookups: all succeeded for requested chars")
  }
}

buildKanjiSet().catch(err => {
  console.error("Failed to build kanjiset", err)
  process.exit(1)
})
