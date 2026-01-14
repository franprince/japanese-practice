export type KanjiDifficulty = "easy" | "medium" | "hard"

export interface KanjiEntry {
  char: string
  meaning_en: string | null
  meaning_es: string | null
  reading?: string | null
  jlpt?: string | null
}

const DB_NAME = "kana-words"
const STORE_NAME = "kanjiData"
const CACHE_PREFIX = "kanji-level-"
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

// In-memory cache per level
const memoryCache: Record<string, Promise<KanjiEntry[]>> = {}

// IndexedDB helpers
const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"))
      return
    }
    const req = indexedDB.open(DB_NAME, 2)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const readCache = async (level: string): Promise<KanjiEntry[] | null> => {
  if (typeof indexedDB === "undefined") return null
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(CACHE_PREFIX + level)
      req.onsuccess = () => {
        const cached = req.result as CachedKanjiData | undefined
        if (!cached) {
          resolve(null)
          return
        }

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
    console.error(`Kanji cache read failed for level ${level}`, e)
    return null
  }
}

const writeCache = async (level: string, data: KanjiEntry[]) => {
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
      const req = store.put(cachedData, CACHE_PREFIX + level)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    console.error(`Kanji cache write failed for level ${level}`, e)
  }
}

// Retry logic with exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error("Failed to fetch kanji data")
}

async function loadLevel(level: string): Promise<KanjiEntry[]> {
  // Check memory cache
  if (memoryCache[level]) return memoryCache[level]

  memoryCache[level] = (async () => {
    // Try IndexedDB cache first
    const cached = await readCache(level).catch(() => null)
    if (cached) return cached

    // Fetch from static file
    try {
      const res = await fetchWithRetry(`/kanji-${level}.json`)
      const data = await res.json() as KanjiEntry[]

      // Cache result
      writeCache(level, data).catch(console.error)

      return data
    } catch (err) {
      delete memoryCache[level] // Clear failed promise
      throw err
    }
  })()

  return memoryCache[level]
}

export async function loadKanjiByLevels(levels: string[]): Promise<KanjiEntry[]> {
  const promises = levels.map(level => loadLevel(level))
  const results = await Promise.all(promises)
  return results.flat()
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
