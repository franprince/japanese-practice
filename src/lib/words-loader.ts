import { kanaDictionary } from "../../data/kanaDictionary"
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

export type WordSets = { hiraganaWords: JapaneseWord[]; katakanaWords: JapaneseWord[] }

type KanaGroup = {
  characters: Record<string, string[]>
}

let cachedPromise: Promise<WordSets> | null = null
const DB_NAME = "kana-words"
const STORE_NAME = "wordSets"
const CACHE_KEY = "v1"

const spawnWorker = () => {
  return new Worker(new URL("../workers/words-worker.ts", import.meta.url), { type: "module" })
}

const buildWordsInWorker = async (): Promise<WordSets> => {
  const worker = spawnWorker()
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      resolve(event.data as WordSets)
      worker.terminate()
    }
    worker.onerror = (err) => {
      worker.terminate()
      reject(err)
    }
  })
}

const mapEntryToWord = (
  entry: any,
  deps: LoaderDeps,
): JapaneseWord | null => {
  const { kanaToRomaji, hasHiragana, hasKatakana, characterGroups } = deps

  const kanaText = entry?.kana?.[0]?.text as string | undefined
  if (!kanaText) return null

  const meaning = entry?.sense?.[0]?.gloss?.[0]?.text as string | undefined
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
  const rawJmdict = await import("../../data/jmdict-spa-3.6.1.json")
  const jmdictWords: JapaneseWord[] = Array.isArray((rawJmdict as any)?.default?.words ?? (rawJmdict as any)?.words)
    ? (((rawJmdict as any)?.default?.words ?? (rawJmdict as any)?.words) as any[])
        .map(entry => mapEntryToWord(entry, deps))
        .filter((w): w is JapaneseWord => w !== null)
    : []

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
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const readCache = async (): Promise<WordSets | null> => {
  if (typeof indexedDB === "undefined") return null
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(CACHE_KEY)
    req.onsuccess = () => resolve((req.result as WordSets) ?? null)
    req.onerror = () => reject(req.error)
  })
}

const writeCache = async (data: WordSets) => {
  if (typeof indexedDB === "undefined") return
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(data, CACHE_KEY)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export const loadWordSets = (_deps: LoaderDeps): Promise<WordSets> => {
  if (!cachedPromise) {
    cachedPromise = (async () => {
      const cached = await readCache().catch(() => null)
      if (cached) return cached
      const canUseWorker = false // temporarily disable worker to avoid port issues
      const fresh = canUseWorker ? await buildWordsInWorker() : await buildWordsInMain(_deps)
      writeCache(fresh).catch(() => undefined)
      return fresh
    })()
  }
  return cachedPromise
}
