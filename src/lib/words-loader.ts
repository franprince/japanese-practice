// ... (imports remain)
import { openDb, STORE_WORDSETS } from "./db"
import type { JapaneseWord } from "./japanese-words"

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
  version: number
  hiraganaWords: JapaneseWord[]
  katakanaWords: JapaneseWord[]
  bothForms?: JapaneseWord[]
}

const WORDSET_LANG = "es".toLowerCase()


const CACHE_NAMESPACE = "prod"
const getCacheKey = (lang: string) => `${CACHE_NAMESPACE}-${lang}`
const cachedPromises: Record<string, Promise<WordSets>> = {}


const readCache = async (lang: string): Promise<WordSets | null> => {
  if (typeof indexedDB === "undefined") return null
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_WORDSETS, "readonly")
      const store = tx.objectStore(STORE_WORDSETS)
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
      const tx = db.transaction(STORE_WORDSETS, "readwrite")
      const store = tx.objectStore(STORE_WORDSETS)
      const req = store.put(data, getCacheKey(lang))
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    console.error("Cache write failed", e)
  }
}

const fetchPrebuiltWordset = async (lang: string, currentVersion?: number): Promise<WordSets | "not-modified" | null> => {
  try {
    const headers: Record<string, string> = {}
    if (currentVersion !== undefined) {
      headers["If-None-Match"] = `"${currentVersion}"`
    }

    const res = await fetch(`/api/wordset?lang=${lang}`, {
      cache: "no-store",
      headers
    })

    if (res.status === 304) {
      return "not-modified"
    }

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
      // 1. Check cache first
      let cached: WordSets | null = null
      try {
        cached = await readCache(datasetLang)
        console.log(`[Loader] Checked cache for ${datasetLang}. Found version:`, cached?.version)
      } catch (e) {
        console.warn("Failed to read cache", e)
      }

      // 2. Conditional fetch using cached version
      console.log(`[Loader] Fetching wordset with If-None-Match: "${cached?.version}"`)
      const remote = await fetchPrebuiltWordset(datasetLang, cached?.version)
      console.log(`[Loader] Fetch result:`, remote === "not-modified" ? "304 Not Modified" : "New Data/Error")

      // 3. Handle response
      if (remote === "not-modified") {
        if (cached) return cached
        // Should not happen unless cache was deleted between read and fetch, retry without version
        const fallback = await fetchPrebuiltWordset(datasetLang)
        if (typeof fallback === "object" && fallback) {
          writeCache(datasetLang, fallback).catch(() => undefined)
          return fallback
        }
        throw new Error(`Failed to load wordset for ${datasetLang} (304 without cache)`)
      }

      if (remote) {
        // New version downloaded
        writeCache(datasetLang, remote).catch(() => undefined)
        return remote
      }

      // 4. Network error - fallback to cache if available
      if (cached) {
        console.warn("Network failed, using cached wordset")
        return cached
      }

      throw new Error(`Failed to load wordset for ${datasetLang}`)
    })()
  }
  return cachedPromises[datasetLang]
}
