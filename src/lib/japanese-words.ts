import kanaDictionaryData from "../../data/kanaDictionary.json";
import type { KanaDictionary, KanaGroup } from "@/types/kana";
import { blacklist } from "../../data/blacklist";
import { loadWordSets } from "./words-loader";
import type { GameMode } from "@/types/game";

const kanaDictionary = kanaDictionaryData as unknown as KanaDictionary;

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
    ; (Object.values(kanaDictionary) as Record<string, KanaGroup>[]).forEach(groups => {
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

export const kanaToRomaji = (text: string) => {
  let romaji = ""
  let i = 0
  const normalized = text || ""
  while (i < normalized.length) {
    const char = normalized[i]

    // Handle sokuon (small tsu) by doubling the next consonant sound
    if (char === "っ" || char === "ッ") {
      // Look ahead to the next kana chunk (prioritize digraph)
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

const isMeaningBlacklisted = (meaning?: string) => {
  if (!meaning) return false
  const lowerMeaning = meaning.toLowerCase()
  return blacklist.some(term => term.trim() && lowerMeaning.includes(term.toLowerCase()))
}

export interface WordFilter {
  selectedGroups: string[]
  minLength: number
  maxLength: number
}

export async function getRandomWord(
  type: GameMode,
  filter?: WordFilter,
  lang?: "en" | "es" | "ja",
): Promise<JapaneseWord | null> {
  const { hiraganaWords, katakanaWords, bothForms } = await loadWordSets({
    characterGroups,
    kanaToRomaji,
    hasHiragana,
    hasKatakana,
  }, lang)

  let words: JapaneseWord[]

  if (type === "hiragana") {
    words = hiraganaWords
  } else if (type === "katakana") {
    words = katakanaWords
  } else {
    const combined = [...hiraganaWords, ...katakanaWords]
    if (bothForms && bothForms.length > 0) {
      combined.push(...bothForms)
    }
    words = combined
  }

  // Global blacklist filter based on meaning
  words = words.filter(word => !isMeaningBlacklisted(word.meaning))

  // Apply filters
  if (filter) {
    const { selectedGroups, minLength, maxLength } = filter

    words = words.filter((word) => {
      // Length filter
      const length = word.kana.length
      if (length < minLength || length > maxLength) return false

      // Group filter - require selections; if none selected, exclude all
      if (selectedGroups.length === 0) return false
      const allGroupsAllowed = word.groups.every((g) => selectedGroups.includes(g))
      if (!allGroupsAllowed) return false

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
export function getRandomCharacter(
  type: GameMode,
  filter?: WordFilter,
): JapaneseWord | null {
  // Determine the target type for this specific character generation
  let targetType: "hiragana" | "katakana" = "hiragana"
  if (type === "both") {
    targetType = Math.random() > 0.5 ? "hiragana" : "katakana"
  } else if (type === "katakana") {
    targetType = "katakana"
  } else {
    targetType = "hiragana"
  }

  // Get all available characters based on mode and filter
  let groups = characterGroups.filter((g) => g.type === targetType)

  // Filter by selected groups
  if (filter) {
    if (filter.selectedGroups.length === 0) return null
    groups = groups.filter((g) => filter.selectedGroups.includes(g.id))
  }

  if (groups.length === 0) return null

  // Determine random length based on filter or default to 1
  const minLen = Math.max(1, filter?.minLength ?? 1)
  const maxLen = Math.max(minLen, filter?.maxLength ?? 1)
  const length = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen

  let kana = ""
  let romaji = ""
  let usedGroups: string[] = []

  // To avoid infinite loops if groups are somehow empty after filtering (checked above), 
  // we do a simple loop.
  for (let i = 0; i < length; i++) {
    // Pick a random group
    const randomGroup = groups[Math.floor(Math.random() * groups.length)]
    if (!randomGroup) break

    // Pick a random character from the group
    const char = randomGroup.characters[Math.floor(Math.random() * randomGroup.characters.length)]
    if (!char) break // Should not happen

    kana += char
    romaji += kanaToRomaji(char)
    if (!usedGroups.includes(randomGroup.id)) {
      usedGroups.push(randomGroup.id)
    }
  }

  return {
    kana,
    romaji,
    type: targetType,
    groups: usedGroups,
  }
}
