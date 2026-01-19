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

const isMobileDevice = () => {
  if (typeof window === "undefined") return false
  if (window.matchMedia?.("(max-width: 768px)").matches) return true
  const ua = navigator.userAgent.toLowerCase()
  return /android|iphone|ipad|ipod|mobile|tablet/.test(ua)
}

const isWordsetConfirmed = (lang: string) => {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(`wordset-confirmed-${lang}`) === "1"
  } catch {
    return false
  }
}


const CACHE_NAMESPACE = "prod"
export const getWordsetCacheKey = (lang: string) => `${CACHE_NAMESPACE}-${lang}`
const cachedPromises: Record<string, Promise<WordSets>> = {}


export const readWordsetCache = async (lang: string): Promise<WordSets | null> => {
  if (typeof indexedDB === "undefined") return null
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_WORDSETS, "readonly")
      const store = tx.objectStore(STORE_WORDSETS)
      const req = store.get(getWordsetCacheKey(lang))
      req.onsuccess = () => resolve(req.result as WordSets)
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    console.warn("IndexedDB read failed", e)
    return null
  }
}

const writeCache = async (lang: string, data: WordSets): Promise<void> => {
  if (typeof indexedDB === "undefined") return
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_WORDSETS, "readwrite")
    const store = tx.objectStore(STORE_WORDSETS)
    store.put(data, getWordsetCacheKey(lang))
  } catch (e) {
    console.warn("IndexedDB write failed", e)
  }
}

export const primeWordsetCache = async (lang: string, data: WordSets): Promise<void> => {
  cachedPromises[lang] = Promise.resolve(data)
  await writeCache(lang, data)
}

const fetchPrebuiltWordset = async (lang: string, currentVersion?: number): Promise<WordSets | "not-modified" | null> => {
  try {
    const headers: Record<string, string> = {};
    if (currentVersion !== undefined) {
      headers["If-None-Match"] = `"${currentVersion}"`;
    }

    const res = await fetch(`/api/wordset?lang=${lang}`, {
      cache: "no-store", // Forces validation with ETag every time
      headers
    });

    if (res.status === 304) {
      return "not-modified"; // Signal that cache is valid
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch wordset: ${res.statusText}`);
    }

    const data = await res.json();
    return data as WordSets;
  } catch (error) {
    console.error("Error fetching wordset:", error);
    return null;
  }
};

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
        cached = await readWordsetCache(datasetLang)
        console.log(`[Loader] Cache probe for ${datasetLang}:`, cached ? `Found v${cached.version}` : "Miss")
      } catch (e) {
        console.warn("Failed to read cache", e)
      }

      // 2. Define fetch/revalidate logic
      const performFetch = async (): Promise<WordSets> => {
        const etagHeader = cached?.version ? `"${cached.version}"` : undefined
        console.log(`[Loader] Network request (If-None-Match: ${etagHeader})`)

        const remote = await fetchPrebuiltWordset(datasetLang, cached?.version)
        console.log(`[Loader] Network result:`, remote === "not-modified" ? "304 Not Modified" : (remote ? "New Data" : "Error"))

        if (remote === "not-modified") {
          if (cached) return cached
          // Fallback if 304 but no cache (shouldn't happen logically but handle for safety)
          const fallback = await fetchPrebuiltWordset(datasetLang)
          if (fallback && typeof fallback === "object") {
            writeCache(datasetLang, fallback).catch(() => undefined)
            return fallback
          }
          throw new Error("Failed to load (304 without cache)")
        }

        if (remote) {
          writeCache(datasetLang, remote).catch(() => undefined)
          return remote
        }

        // Network failed
        if (cached) {
          console.warn("[Loader] Network failed, using cache")
          return cached
        }
        throw new Error(`Failed to load wordset for ${datasetLang}`)
      }

      // 3. SWR Strategy
      if (cached) {
        console.log("[Loader] SWR: Serving cached content immediately")
        // Revalidate in background without awaiting
        performFetch().catch(err => console.error("[Loader] Background revalidation failed:", err))
        return cached
      }

      // 3b. Mobile guard: do not fetch until user confirms
      if (isMobileDevice() && !isWordsetConfirmed(datasetLang)) {
        throw new Error(`Wordset fetch blocked until user confirms for ${datasetLang}`)
      }

      // 4. Cold Start
      console.log("[Loader] Cold start: Waiting for network")
      return performFetch()
    })().catch((err) => {
      delete cachedPromises[datasetLang]
      throw err
    })
  }
  return cachedPromises[datasetLang]
}
