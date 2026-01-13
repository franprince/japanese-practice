export type KanjiDifficulty = "easy" | "medium" | "hard"

export interface KanjiEntry {
  char: string
  meaning_en: string | null
  meaning_es: string | null
  reading?: string | null
  jlpt?: string | null
}

const datasetUrl = "/api/kanjiset"
const DB_NAME = "kana-words"
const STORE_NAME = "kanjiData"
const CACHE_KEY = "kanjiset-v1"
const CACHE_EXPIRY_DAYS = 7

const shuffle = <T,>(arr: T[]) => {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]!
    copy[i] = copy[j]!
    copy[j] = temp
  }
  return copy
}

interface CachedKanjiData {
  data: KanjiEntry[]
  timestamp: number
}

let kanjiCache: Promise<KanjiEntry[]> | null = null

// IndexedDB helpers
const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"))
      return
    }
    const req = indexedDB.open(DB_NAME, 2) // Version 2 to ensure upgrade runs
    req.onupgradeneeded = (event) => {
      const db = req.result
      // Only create the store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const readCache = async (): Promise<KanjiEntry[] | null> => {
  if (typeof indexedDB === "undefined") return null
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(CACHE_KEY)
      req.onsuccess = () => {
        const cached = req.result as CachedKanjiData | undefined
        if (!cached) {
          resolve(null)
          return
        }

        // Check if cache is expired
        const now = Date.now()
        const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
        if (now - cached.timestamp > expiryMs) {
          resolve(null)
          return
        }

        resolve(cached.data)
      }
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    console.error("Kanji cache read failed", e)
    return null
  }
}

const writeCache = async (data: KanjiEntry[]) => {
  if (typeof indexedDB === "undefined") return
  try {
    const db = await openDb()
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)
      const cachedData: CachedKanjiData = {
        data,
        timestamp: Date.now()
      }
      const req = store.put(cachedData, CACHE_KEY)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    console.error("Kanji cache write failed", e)
  }
}

// Retry logic with exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error("Failed to fetch kanji data")
}

export async function loadKanjiSet(): Promise<KanjiEntry[]> {
  if (kanjiCache) return kanjiCache

  kanjiCache = (async () => {
    // Try cache first
    const cached = await readCache().catch(() => null)
    if (cached) {
      return cached
    }

    // Fetch from API with retry logic
    try {
      const res = await fetchWithRetry(datasetUrl)
      const data = await res.json() as KanjiEntry[]

      // Cache the result
      writeCache(data).catch(err => {
        console.error("Failed to cache kanji data:", err)
      })

      return data
    } catch (err) {
      kanjiCache = null
      throw new Error(`Failed to load kanji dataset: ${err}`)
    }
  })()

  return kanjiCache
}

export function getRandomKanji(list: KanjiEntry[], exclude?: KanjiEntry) {
  if (!list.length) throw new Error("Kanji list is empty")
  let kanji: KanjiEntry | undefined
  do {
    kanji = list[Math.floor(Math.random() * list.length)]
  } while (exclude && kanji && kanji.char === exclude.char)
  return kanji!
}

export function getRandomOptions(list: KanjiEntry[], correct: KanjiEntry, count = 3): KanjiEntry[] {
  const options: KanjiEntry[] = [correct]
  const available = list.filter(k => k.char !== correct.char)

  while (options.length < count && available.length > 0) {
    const randomIndex = Math.floor(Math.random() * available.length)
    options.push(available[randomIndex]!)
    available.splice(randomIndex, 1)
  }

  return shuffle(options)
}
