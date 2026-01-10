import fs from "fs"
import path from "path"

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

const VERSION = process.env.KANJISET_VERSION || "v1"
const OUTPUT_PATH = path.join(process.cwd(), "data", `kanjiset-${VERSION}.json`)

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

const buildKanjiSet = async () => {
  const baseDir = process.cwd()
  const mostUsed: KanjiSource[] = JSON.parse(
    await fs.promises.readFile(path.join(baseDir, "data", "most_used_kanjis.json"), "utf8"),
  )

  const engDict = await readJson(path.join(baseDir, "data", "jmdict-eng-3.6.2.json"))
  const spaDict = await readJson(path.join(baseDir, "data", "jmdict-spa-3.6.1.json"))

  const engLookup = buildGlossLookup(engDict)
  const spaLookup = buildGlossLookup(spaDict)

  // If a previous dataset exists (any version), reuse its English meanings to avoid re-requesting
  const previousMeaningLookup: Record<string, string | null> = {}
  const previousReadingLookup: Record<string, string | null> = {}
  const previousJlptLookup: Record<string, string | null> = {}
  const dataDir = path.join(baseDir, "data")
  try {
    const files = await fs.promises.readdir(dataDir)
    const candidates = files.filter(f => /^kanjiset-.*\.json$/.test(f))
    // Prefer latest by lexicographic order (e.g., v2 > v1). Adjust if semantic versions are used.
    const latest = candidates.sort().reverse()[0]
    const target = latest ? path.join(dataDir, latest) : OUTPUT_PATH
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

  // Fallback to Jisho API for missing English meanings
  const missingJishoChars = mostUsed
    .map(item => item.char)
    .filter(char => !engLookup[char] || !previousMeaningLookup[char] || !previousReadingLookup[char] || !previousJlptLookup[char])

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

  for (const kanji of missingJishoChars) {
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
    await delay(throttleMs)
  }

  const payload = mostUsed.map(item => {
    const meaningEn = engLookup[item.char] ?? previousMeaningLookup[item.char] ?? jishoMeanings[item.char] ?? null
    const reading = previousReadingLookup[item.char] ?? jishoReadings[item.char] ?? null
    const jlpt = previousJlptLookup[item.char] ?? jishoJlpt[item.char] ?? null
    const meaningEs = spaLookup[item.char] ?? null
    return {
      ...item,
      meaning_en: meaningEn,
      meaning_es: meaningEs,
      reading,
      jlpt,
    }
  })

  await fs.promises.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf8")
  const missingEn = payload.filter(p => !p.meaning_en).length
  const missingEs = payload.filter(p => !p.meaning_es).length
  const missingReading = payload.filter(p => !p.reading).length
  const missingJlpt = payload.filter(p => !p.jlpt).length
  console.log(`kanjiset written to ${OUTPUT_PATH}`)
  console.log(`Missing meanings -> en: ${missingEn}, es: ${missingEs}, reading: ${missingReading}, jlpt: ${missingJlpt}`)
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
