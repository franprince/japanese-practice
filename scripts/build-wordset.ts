import fs from "fs"
import path from "path"
import { kanaDictionary, type KanaDictionary, type KanaGroup } from "../data/kanaDictionary"
import { blacklist } from "../data/blacklist"
import type { JapaneseWord } from "../src/lib/japanese-words"

const WORDSET_VERSION = process.env.WORDSET_VERSION || process.env.NEXT_PUBLIC_WORDSET_VERSION || "v1"
const WORDSET_LANG = (process.env.WORDSET_LANG || process.env.NEXT_PUBLIC_WORDSET_LANG || "es").toLowerCase()
const SOURCE_FILE =
  WORDSET_LANG === "en"
    ? "jmdict-eng-3.6.2.json"
    : "jmdict-spa-3.6.1.json" // default to Spanish if unknown
const OUTPUT_PATH = path.join(process.cwd(), "public", `wordset-${WORDSET_LANG}-${WORDSET_VERSION}.json`)

const hiraToKata = (char: string) => {
  const code = char.charCodeAt(0)
  // hiragana block: 3040-309F; katakana starts at 30A0
  return String.fromCharCode(code + 0x60)
}
const kataToHira = (text: string) =>
  Array.from(text)
    .map(ch => {
      const code = ch.charCodeAt(0)
      // katakana block: 30A0-30FF; hiragana starts at 3040 (subtract 0x60)
      if (code >= 0x30a0 && code <= 0x30ff) {
        return String.fromCharCode(code - 0x60)
      }
      return ch
    })
    .join("")

const hasHiragana = (text: string) => /[\u3040-\u309F]/.test(text)
const hasKatakana = (text: string) => /[\u30A0-\u30FF]/.test(text)

const buildKanaRomajiMap = () => {
  const map: Record<string, string> = {}
  Object.values(kanaDictionary as KanaDictionary).forEach((groups: Record<string, KanaGroup>) => {
    Object.values(groups).forEach((group: KanaGroup) => {
      Object.entries(group.characters).forEach(([kana, romajiList]) => {
        if (Array.isArray(romajiList) && romajiList.length > 0) {
          map[kana] = romajiList[0] ?? ""
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

const buildCharacterGroups = () =>
  Object.entries(kanaDictionary).flatMap(([typeKey, groups]) =>
    Object.entries(groups as Record<string, { characters: Record<string, string[]> }>).map(([groupId, group]) => {
      const characters = Object.keys(group.characters)
      return {
        id: groupId,
        type: typeKey as "hiragana" | "katakana",
        characters,
      }
    }),
  )

const characterGroups = buildCharacterGroups()

const mapEntryToWord = (entry: any): JapaneseWord | null => {
  const kanaText = entry?.kana?.[0]?.text as string | undefined
  if (!kanaText) return null

  const meaning = Array.isArray(entry?.sense?.[0]?.gloss)
    ? entry.sense[0].gloss.map((g: any) => g?.text).filter(Boolean).join(", ")
    : (entry?.sense?.[0]?.gloss?.[0]?.text as string | undefined)
  const kanji = entry?.kanji?.[0]?.text as string | undefined

  const lowerMeaning = meaning?.toLowerCase() ?? ""
  const isBlacklisted =
    lowerMeaning && blacklist.some(term => term.trim() && lowerMeaning.includes(term.toLowerCase()))
  if (isBlacklisted) return null

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

const buildWordSet = async () => {
  const raw = await fs.promises.readFile(path.join(process.cwd(), "data", SOURCE_FILE), "utf8")
  const parsed = JSON.parse(raw)
  const entries = Array.isArray(parsed?.default?.words ?? parsed?.words) ? (parsed.default?.words ?? parsed.words) : []

  const jmdictWords: JapaneseWord[] = (entries as any[])
    .map(mapEntryToWord)
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

  const dictionaryCharWords: JapaneseWord[] = Object.entries(
    kanaDictionary as Record<JapaneseWord["type"], Record<string, { characters: Record<string, string[]> }>>,
  ).flatMap(([typeKey, groups]) => {
    return Object.entries(groups).flatMap(([groupId, groupValue]) => {
      const characters: Record<string, string[]> = groupValue?.characters ?? {}
      return Object.entries(characters).map(([kana, romajiList]) => {
        const lookup = jmdictLookupByKana[kana] || {}
        const matchedGroups = characterGroups
          .filter(g => g.type === typeKey && g.characters.some(ch => kana.includes(ch)))
          .map(g => g.id)

        return {
          kana,
          romaji: Array.isArray(romajiList) && romajiList.length > 0 ? romajiList[0] ?? "" : "",
          type: typeKey as JapaneseWord["type"],
          meaning: lookup.meaning,
          kanji: lookup.kanji,
          groups: matchedGroups.length ? matchedGroups : [groupId],
        }
      })
    })
  })

  const jmdictWordsWithGroups: JapaneseWord[] = jmdictWords.map(word => {
    const groups = characterGroups
      .filter(g => g.type === word.type && g.characters.some(ch => word.kana.includes(ch)))
      .map(g => g.id)
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

  const hiraganaWords = mergedWords.filter(w => w.type === "hiragana")
  const katakanaWords = mergedWords.filter(w => w.type === "katakana")

  const hiraSet = new Set(hiraganaWords.map(w => w.kana))
  const bothForms = katakanaWords.filter(w => hiraSet.has(kataToHira(w.kana)))

  const payload = {
    hiraganaWords,
    katakanaWords,
    bothForms,
  }

  await fs.promises.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await fs.promises.writeFile(OUTPUT_PATH, JSON.stringify(payload))
  console.log(`wordset written to ${OUTPUT_PATH} (version ${WORDSET_VERSION})`)
}

buildWordSet().catch(err => {
  console.error("Failed to build wordset", err)
  process.exit(1)
})
