import rawJmdict from "../../data/jmdict-spa-3.6.1.json";
import { kanaDictionary } from "../../data/kanaDictionary";

type KanaGroup = {
  characters: Record<string, string[]>
}

export interface JapaneseWord {
  kana: string
  romaji: string
  type: "hiragana" | "katakana"
  meaning?: string
  groups: string[] // Added groups for filtering
  kanji?: string
}

export interface CharacterGroup {
  id: string
  label: string
  labelJp: string
  type: "hiragana" | "katakana"
  characters: string[]
}

const buildCharacterGroups = (): CharacterGroup[] =>
  Object.entries(kanaDictionary).flatMap(([typeKey, groups]) =>
    Object.entries(groups as Record<string, KanaGroup>).map(([groupId, group]) => {
      const characters = Object.keys(group.characters)
      const firstKana = characters[0] || groupId
      const firstRomaji = (group.characters[firstKana] ?? [groupId])[0] ?? groupId
      const typeLabel = typeKey === "hiragana" ? "Hiragana" : "Katakana"
      return {
        id: groupId,
        label: `${typeLabel} · ${firstRomaji}`,
        labelJp: characters.join(" / "),
        type: typeKey as CharacterGroup["type"],
        characters,
      }
    }),
  )

const buildKanaRomajiMap = (): Record<string, string> => {
  const map: Record<string, string> = {}
  ;(Object.values(kanaDictionary) as Record<string, KanaGroup>[]).forEach(groups => {
    Object.values(groups).forEach((group: KanaGroup) => {
      Object.entries(group.characters).forEach(([kana, romajiList]) => {
        if (!map[kana]) {
          map[kana] = Array.isArray(romajiList) && romajiList.length > 0 ? romajiList[0] ?? "" : ""
        }
      })
    })
  })
  return map
}

export const characterGroups: CharacterGroup[] = buildCharacterGroups()
const kanaRomajiMap: Record<string, string> = buildKanaRomajiMap()

const hasHiragana = (text: string) => /[\u3040-\u309F]/.test(text)
const hasKatakana = (text: string) => /[\u30A0-\u30FF]/.test(text)

const hiraToKata = (text: string) =>
  text.replace(/[\u3041-\u3096]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60))

const kanaToRomaji = (text: string) => {
  let romaji = ""
  let i = 0
  const normalized = text || ""
  while (i < normalized.length) {
    const tri = normalized.slice(i, i + 2)
    if (kanaRomajiMap[tri]) {
      romaji += kanaRomajiMap[tri]
      i += 2
      continue
    }
    const char = normalized[i]
    if (!char) break
    const mapped = kanaRomajiMap[char] || kanaRomajiMap[hiraToKata(char)] || ""
    romaji += mapped
    i += 1
  }
  return romaji || text
}

const mapEntryToWord = (entry: any): JapaneseWord | null => {
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

const jmdictWords: JapaneseWord[] = Array.isArray((rawJmdict as any)?.words)
  ? ((rawJmdict as any).words as any[])
      .map(mapEntryToWord)
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
        characterGroups
          .filter(g => g.type === typeKey && g.characters.some(ch => kana.includes(ch)))
          .map(g => g.id) || []

      return {
        kana,
        romaji: Array.isArray(romajiList) && romajiList.length > 0 ? romajiList[0] ?? "" : "",
        type: typeKey,
        meaning: lookup.meaning,
        kanji: lookup.kanji,
        groups: matchedGroups.length ? matchedGroups : [groupId],
      } satisfies JapaneseWord
    })
  })
})

const jmdictWordsWithGroups: JapaneseWord[] = jmdictWords.map(word => {
  const groups =
    characterGroups
      .filter(g => g.type === word.type && g.characters.some(ch => word.kana.includes(ch)))
      .map(g => g.id) || []
  return { ...word, groups }
})

const mergedWords = [...dictionaryCharWords, ...jmdictWordsWithGroups].reduce<JapaneseWord[]>((acc, curr) => {
  const exists = acc.find(w => w.kana === curr.kana && w.type === curr.type)
  if (!exists) acc.push(curr)
  return acc
}, [])

export const katakanaWords: JapaneseWord[] = mergedWords.filter(w => w.type === "katakana")
export const hiraganaWords: JapaneseWord[] = mergedWords.filter(w => w.type === "hiragana")

export interface WordFilter {
  selectedGroups: string[]
  minLength: number
  maxLength: number
}

export function getRandomWord(type: "hiragana" | "katakana" | "both", filter?: WordFilter): JapaneseWord | null {
  let words: JapaneseWord[]

  if (type === "hiragana") {
    words = hiraganaWords
  } else if (type === "katakana") {
    words = katakanaWords
  } else {
    words = [...hiraganaWords, ...katakanaWords]
  }

  // Apply filters
  if (filter) {
    const { selectedGroups, minLength, maxLength } = filter

    words = words.filter((word) => {
      // Length filter
      const length = word.kana.length
      if (length < minLength || length > maxLength) return false

      // Group filter - word must contain at least one character from selected groups
      if (selectedGroups.length > 0) {
        const hasMatchingGroup = word.groups.some((g) => selectedGroups.includes(g))
        if (!hasMatchingGroup) return false
      }

      return true
    })
  }

  if (words.length === 0) return null
  const choice = words[Math.floor(Math.random() * words.length)]
  return choice ?? null
}

export function getGroupsByType(type: "hiragana" | "katakana" | "both"): CharacterGroup[] {
  if (type === "hiragana") {
    return characterGroups.filter((g) => g.type === "hiragana")
  } else if (type === "katakana") {
    return characterGroups.filter((g) => g.type === "katakana")
  }
  return characterGroups
}
