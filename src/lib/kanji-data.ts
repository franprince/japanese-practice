export type KanjiDifficulty = "easy" | "medium" | "hard"

export interface KanjiEntry {
  char: string
  meaning_en: string | null
  meaning_es: string | null
  reading?: string | null
  jlpt?: string | null
}

const datasetUrl = "/api/kanjiset"

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

let kanjiCache: Promise<KanjiEntry[]> | null = null

export async function loadKanjiSet(): Promise<KanjiEntry[]> {
  if (kanjiCache) return kanjiCache
  
  kanjiCache = fetch(datasetUrl, { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error("Failed to load kanji dataset")
      return res.json() as Promise<KanjiEntry[]>
    })
    .catch(err => {
      kanjiCache = null
      throw err
    })
  
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
