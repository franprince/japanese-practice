// ... (imports remain)
import type { JapaneseWord } from "./japanese-words"
import { loadKanaDictionary } from "./data/kana-dictionary-loader"
import type { KanaGroup } from "@/types/kana"

export type LoaderDeps = {
  characterGroups: Array<{
    id: string
    label: string
    labelJp: string
    type: "hiragana" | "katakana"
    characters: string[]
  }>
  kanaToRomaji: (text: string) => string
  hasHiragana: (text: string) => boolean
  hasKatakana: (text: string) => boolean
}

export type WordSets = {
  hiraganaWords: JapaneseWord[]
  katakanaWords: JapaneseWord[]
  bothForms?: JapaneseWord[]
}

const WORDSET_LANG = "es".toLowerCase()
const CACHE_VERSION = "v1"
const CACHE_NAMESPACE = "prod"
const getCacheKey = (lang: string) => `${CACHE_VERSION}-${CACHE_NAMESPACE}-${lang}`
const cachedPromises: Record<string, Promise<WordSets>> = {}
const DB_NAME = "kana-words"
const STORE_NAME = "wordSets"

// Removed worker code

export const mapEntryToWord = (
  entry: any,
  deps: LoaderDeps,
): JapaneseWord | null => {
  // ... (implementation same as before)
  const { kanaToRomaji, hasHiragana, hasKatakana, characterGroups } = deps

  const kanaText = entry?.kana?.[0]?.text as string | undefined
  if (!kanaText) return null

  const meaning = Array.isArray(entry?.sense?.[0]?.gloss)
    ? entry.sense[0].gloss.map((g: any) => g?.text).filter(Boolean).join(", ")
    : (entry?.sense?.[0]?.gloss?.[0]?.text as string | undefined)
  const kanji = entry?.kanji?.[0]?.text as string | undefined

  const type: "hiragana" | "katakana" | null = hasKatakana(kanaText)
    ? "katakana"
    : hasHiragana(kanaText)
      ? "hiragana"
      : null

  if (!type) return null

  const groups = characterGroups
    .filter(g => g.type === type && g.characters.some(ch => kanaText.includes(ch)))
    .map(g => g.id)

  return {
    kana: kanaText,
    romaji: kanaToRomaji(kanaText),
    type,
    meaning,
    groups,
    kanji,
  }
}

const buildWordsInMain = async (deps: LoaderDeps): Promise<WordSets> => {
  // ... (implementation same as before)
  // Load dictionary asynchronously
  const kanaDictionary = await loadKanaDictionary()

  const rawJmdict = await import("../../data/jmdict-spa-3.6.1.json")

  // Cast to any to handle the JSON structure safely
  const rawData: any = rawJmdict
  const wordsList: any[] = Array.isArray(rawData?.default?.words)
    ? rawData.default.words
    : (Array.isArray(rawData?.words) ? rawData.words : [])

  const jmdictWords: JapaneseWord[] = wordsList
    .map(entry => mapEntryToWord(entry, deps))
    .filter((w): w is JapaneseWord => w !== null)

  const jmdictLookupByKana: Record<string, Pick<JapaneseWord, "meaning" | "kanji">> = jmdictWords.reduce(
    (acc, word) => {
      if (!acc[word.kana]) {
        acc[word.kana] = { meaning: word.meaning, kanji: word.kanji }
      }
      return acc
    },
    {} as Record<string, Pick<JapaneseWord, "meaning" | "kanji">>,
  )

  const dictionaryCharWords: JapaneseWord[] = (
    Object.entries(kanaDictionary) as [JapaneseWord["type"], Record<string, KanaGroup>][]
  ).flatMap(([typeKey, groups]) => {
    return Object.entries(groups).flatMap(([groupId, groupValue]) => {
      const characters: Record<string, string[]> = groupValue?.characters ?? {}
      return Object.entries(characters).map(([kana, romajiList]) => {
        const lookup = jmdictLookupByKana[kana] || {}
        const matchedGroups =
          deps.characterGroups
            .filter(g => g.type === typeKey && g.characters.some(ch => kana.includes(ch)))
            .map(g => g.id) || []

        return {
          kana,
          romaji: Array.isArray(romajiList) && romajiList.length > 0 ? romajiList[0] ?? "" : "",
          type: typeKey as JapaneseWord["type"],
          meaning: lookup.meaning,
          kanji: lookup.kanji,
          groups: matchedGroups.length ? matchedGroups : [groupId],
        } satisfies JapaneseWord
      })
    })
  })

  const jmdictWordsWithGroups: JapaneseWord[] = jmdictWords.map(word => {
    const groups =
      deps.characterGroups
        .filter(g => g.type === word.type && g.characters.some(ch => word.kana.includes(ch)))
        .map(g => g.id) || []
    return { ...word, groups }
  })

  const seen = new Map<string, boolean>()
  const mergedWords: JapaneseWord[] = []
  for (const word of [...dictionaryCharWords, ...jmdictWordsWithGroups]) {
    const key = `${word.kana}|${word.type}`
    if (!seen.has(key)) {
      seen.set(key, true)
      mergedWords.push(word)
    }
  }

  return {
    katakanaWords: mergedWords.filter(w => w.type === "katakana"),
    hiraganaWords: mergedWords.filter(w => w.type === "hiragana"),
  }
}

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"))
      return
    }
    const req = indexedDB.open(DB_NAME, 2) // Version 2 for consistency with kanji-data
    req.onupgradeneeded = () => {
      const db = req.result
      // Only create the store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const readCache = async (lang: string): Promise<WordSets | null> => {
  if (typeof indexedDB === "undefined") return null
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(getCacheKey(lang))
      req.onsuccess = () => resolve((req.result as WordSets) ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    console.error("Cache read failed", e)
    return null
  }
}

const writeCache = async (lang: string, data: WordSets) => {
  if (typeof indexedDB === "undefined") return
  try {
    const db = await openDb()
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(data, getCacheKey(lang))
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    console.error("Cache write failed", e)
  }
}

const fetchPrebuiltWordset = async (lang: string): Promise<WordSets | null> => {
  try {
    const res = await fetch(`/api/wordset?lang=${lang}`, { cache: "no-store" })
    if (!res.ok) return null
    const json = (await res.json()) as WordSets
    if (!json?.hiraganaWords || !json?.katakanaWords) return null
    return json
  } catch {
    return null
  }
}

export const normalizeLang = (lang: string | undefined): string => {
  const lower = (lang || WORDSET_LANG || "es").toLowerCase()
  if (lower === "ja") return "en"
  if (lower === "en" || lower === "es") return lower
  return "es"
}

export const loadWordSets = (_deps: LoaderDeps, lang?: string): Promise<WordSets> => {
  const datasetLang = normalizeLang(lang)
  if (!cachedPromises[datasetLang]) {
    cachedPromises[datasetLang] = (async () => {
      const cached = await readCache(datasetLang).catch(() => null)
      if (cached) return cached
      const prebuilt = await fetchPrebuiltWordset(datasetLang)
      if (prebuilt) {
        writeCache(datasetLang, prebuilt).catch(() => undefined)
        return prebuilt
      }
      // Worker path removed
      const fresh = await buildWordsInMain(_deps)
      writeCache(datasetLang, fresh).catch(() => undefined)
      return fresh
    })()
  }
  return cachedPromises[datasetLang]
}
