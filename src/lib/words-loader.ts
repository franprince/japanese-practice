// ... (imports remain)
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
const DB_NAME = "kana-words"
const STORE_NAME = "wordSets"

// Removed worker code



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
      // Fetch remote wordset
      const remote = await fetchPrebuiltWordset(datasetLang)
      if (!remote) throw new Error(`Failed to load wordset for ${datasetLang}`)

      // Check cache
      const cached = await readCache(datasetLang).catch(() => null)

      // Compare versions - use remote if cache is missing, outdated, or has no version
      if (!cached || !cached.version || cached.version < remote.version) {
        // Cache is outdated or missing, use remote and update cache
        writeCache(datasetLang, remote).catch(() => undefined)
        return remote
      }

      // Use cached version (same or newer)
      return cached
    })()
  }
  return cachedPromises[datasetLang]
}
