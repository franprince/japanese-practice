/// <reference lib="webworker" />

import { kanaDictionary } from "../../data/kanaDictionary"

type KanaGroup = {
  characters: Record<string, string[]>
}

type CharacterGroup = {
  id: string
  label: string
  labelJp: string
  type: "hiragana" | "katakana"
  characters: string[]
}

type JapaneseWord = {
  kana: string
  romaji: string
  type: "hiragana" | "katakana"
  meaning?: string
  groups: string[]
  kanji?: string
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

const hasHiragana = (text: string) => /[\u3040-\u309F]/.test(text)
const hasKatakana = (text: string) => /[\u30A0-\u30FF]/.test(text)

const hiraToKata = (text: string) =>
  text.replace(/[\u3041-\u3096]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60))

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

const kanaRomajiMap = buildKanaRomajiMap()

const kanaToRomaji = (text: string) => {
  let romaji = ""
  let i = 0
  const normalized = text || ""
  while (i < normalized.length) {
    const char = normalized[i]

    // Handle sokuon (small tsu) by doubling the next consonant sound
    if (char === "っ" || char === "ッ") {
      const nextTri = normalized.slice(i + 1, i + 3)
      const nextChar = normalized[i + 1]
      const nextMapped =
        (nextTri && kanaRomajiMap[nextTri]) ||
        (nextChar && (kanaRomajiMap[nextChar] || kanaRomajiMap[hiraToKata(nextChar)])) ||
        ""
      if (nextMapped) {
        const first = nextMapped[0] ?? ""
        if (/[bcdfghjklmnpqrstvwxyz]/i.test(first)) {
          romaji += first
        }
      }
      i += 1
      continue
    }

    const tri = normalized.slice(i, i + 2)
    if (kanaRomajiMap[tri]) {
      romaji += kanaRomajiMap[tri]
      i += 2
      continue
    }
    if (!char) break
    const mapped = kanaRomajiMap[char] || kanaRomajiMap[hiraToKata(char)] || ""
    romaji += mapped
    i += 1
  }
  return romaji || text
}

const mapEntryToWord = (entry: any, characterGroups: CharacterGroup[]): JapaneseWord | null => {
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

const buildWords = async (): Promise<{ hiraganaWords: JapaneseWord[]; katakanaWords: JapaneseWord[] }> => {
  const characterGroups = buildCharacterGroups()
  const rawJmdict = await import("../../data/jmdict-spa-3.6.1.json")
  const jmdictWords: JapaneseWord[] = Array.isArray((rawJmdict as any)?.default?.words ?? (rawJmdict as any)?.words)
    ? (((rawJmdict as any)?.default?.words ?? (rawJmdict as any)?.words) as any[])
        .map(entry => mapEntryToWord(entry, characterGroups))
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

  return {
    katakanaWords: mergedWords.filter(w => w.type === "katakana"),
    hiraganaWords: mergedWords.filter(w => w.type === "hiragana"),
  }
}

self.onmessage = async () => {
  const result = await buildWords()
  postMessage(result)
}
