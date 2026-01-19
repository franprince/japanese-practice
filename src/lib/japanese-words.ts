import { blacklist } from "../../src/lib/data/blacklist";
import { loadWordSets, normalizeLang } from "./words-loader";
import type { GameMode } from "@/types/game";
import {
  getCharacterGroups,
  getKanaRomajiMap,
  getCharacterGroupsSync,
  getKanaRomajiMapSync,
  type CharacterGroup as LoaderCharacterGroup
} from "./data/kana-dictionary-loader";

export interface JapaneseWord {
  kana: string
  romaji: string
  type: "hiragana" | "katakana"
  meaning?: string
  groups: string[] // Added groups for filtering
  kanji?: string
}

// Re-export CharacterGroup type from loader
export type CharacterGroup = LoaderCharacterGroup

// Lazy-loaded data - use getCharacterGroups() and getKanaRomajiMap() for async access
// For backwards compatibility, export sync versions (will be empty until loaded)
export const characterGroups: CharacterGroup[] = getCharacterGroupsSync()

// Internal helper to get kana romaji map synchronously
const getKanaRomajiMapInternal = (): Record<string, string> => getKanaRomajiMapSync()

const hasHiragana = (text: string) => /[\u3040-\u309F]/.test(text)
const hasKatakana = (text: string) => /[\u30A0-\u30FF]/.test(text)

const MOBILE_WORDSET_MAX = 1500
const filteredWordCache = new Map<string, JapaneseWord[]>()

const isMobileDevice = () => {
  if (typeof window === "undefined") return false
  if (window.matchMedia?.("(max-width: 768px)").matches) return true
  const ua = navigator.userAgent.toLowerCase()
  return /android|iphone|ipad|ipod|mobile|tablet/.test(ua)
}

const buildFilterKey = (type: GameMode, filter: WordFilter | undefined, lang: string, isMobile: boolean) => {
  if (!filter) return `${type}:${lang}:${isMobile ? "mobile" : "desktop"}:none`
  const sortedGroups = [...filter.selectedGroups].sort()
  return `${type}:${lang}:${isMobile ? "mobile" : "desktop"}:${filter.minLength}-${filter.maxLength}:${sortedGroups.join("|")}`
}

const clampWordsetForMobile = (words: JapaneseWord[]) => {
  if (!isMobileDevice() || words.length <= MOBILE_WORDSET_MAX) return words
  const shuffled = [...words]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = current
  }
  return shuffled.slice(0, MOBILE_WORDSET_MAX)
}

const hiraToKata = (text: string) =>
  text.replace(/[\u3041-\u3096]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60))

export const kanaToRomaji = (text: string) => {
  const kanaRomajiMap = getKanaRomajiMapInternal()
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
  // Ensure character groups are loaded before we need them
  const loadedCharacterGroups = await getCharacterGroups()

  let wordSets
  try {
    wordSets = await loadWordSets({
      characterGroups: loadedCharacterGroups,
      kanaToRomaji,
      hasHiragana,
      hasKatakana,
    }, lang)
  } catch (err) {
    const message = err instanceof Error ? err.message : ""
    if (message.includes("Wordset fetch blocked until user confirms")) {
      return null
    }
    throw err
  }

  const { hiraganaWords, katakanaWords, bothForms } = wordSets

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

  const datasetLang = normalizeLang(lang)
  const mobile = isMobileDevice()
  const cacheKey = buildFilterKey(type, filter, datasetLang, mobile)
  const cached = filteredWordCache.get(cacheKey)

  if (cached) {
    words = cached
  } else {
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

    words = clampWordsetForMobile(words)
    filteredWordCache.set(cacheKey, words)
  }

  if (words.length === 0) return null
  const choice = words[Math.floor(Math.random() * words.length)]
  return choice ?? null
}
export async function getRandomCharacter(
  type: GameMode,
  filter?: WordFilter,
): Promise<JapaneseWord | null> {
  const loadedCharacterGroups = await getCharacterGroups()
  await getKanaRomajiMap() // Ensure romaji map is loaded for kanaToRomaji conversion

  // Helper to convert mode to type
  const modeToType = (mode: GameMode): "hiragana" | "katakana" =>
    mode === "katakana" ? "katakana"
      : mode === "both" ? (Math.random() > 0.5 ? "hiragana" : "katakana")
        : "hiragana"

  // Determine target type from selected groups or mode
  const selectedTypes = (filter?.selectedGroups ?? [])
    .map(id => loadedCharacterGroups.find(g => g.id === id)?.type)
    .filter((t): t is "hiragana" | "katakana" => Boolean(t))
  const hasH = selectedTypes.includes("hiragana")
  const hasK = selectedTypes.includes("katakana")

  // If both types are available and mode is "both", allow mixed selection per prompt
  const allowMixed = type === "both" && (filter?.selectedGroups?.length ? hasH && hasK : true)

  let targetType: "hiragana" | "katakana" = modeToType(type)
  if (!allowMixed && filter?.selectedGroups && filter.selectedGroups.length > 0) {
    targetType = hasK && !hasH ? "katakana" : hasH && !hasK ? "hiragana" : modeToType(type)
  }

  let groups = allowMixed
    ? loadedCharacterGroups
    : loadedCharacterGroups.filter((g) => g.type === targetType)

  // Apply group filter
  if (filter?.selectedGroups !== undefined) {
    if (filter.selectedGroups.length === 0) return null
    groups = groups.filter((g) => filter.selectedGroups.includes(g.id))
  }

  // Apply weighted filtering for special groups when many groups are selected
  // Special groups are h_group16_a through h_group26_a (hiragana combos)
  // and k_group18_a onwards (katakana combos)
  if (filter?.selectedGroups) {
    const totalGroups = loadedCharacterGroups.filter((g) => g.type === targetType).length
    const selectedCount = filter.selectedGroups.filter(id => {
      const group = loadedCharacterGroups.find(g => g.id === id)
      return group?.type === targetType
    }).length
    const selectionRatio = selectedCount / totalGroups

    // Only apply weighting when more than 50% of groups are selected
    if (selectionRatio > 0.5) {
      const specialGroupPattern = /^h(1[6-9]|2[0-6])_a$|^k(1[8-9]|[2-3][0-9])_a$/

      // Filter out some special groups (keep ~40% of them)
      groups = groups.filter(g => {
        const isSpecialGroup = specialGroupPattern.test(g.id)
        if (isSpecialGroup) {
          // Keep only 40% of special groups
          return Math.random() < 0.4
        }
        return true
      })
    }
  }

  if (groups.length === 0) return null

  const length = filter?.minLength
    ? Math.floor(Math.random() * (filter.maxLength - filter.minLength + 1)) + filter.minLength
    : 1

  let kana = ""
  let romaji = ""
  const usedGroups: string[] = []
  let wordType: "hiragana" | "katakana" | undefined

  for (let i = 0; i < length; i++) {
    const randomGroup = groups[Math.floor(Math.random() * groups.length)]
    if (!randomGroup) break

    const char = randomGroup.characters[Math.floor(Math.random() * randomGroup.characters.length)]
    if (!char) continue

    kana += char
    const charRomaji = kanaToRomaji(char)

    if (!wordType) {
      wordType = randomGroup.type as "hiragana" | "katakana"
    }

    if (char === "い" && charRomaji !== "i") {
      console.warn(`[Suspicious Romaji] Char: ${char}, Mapped: '${charRomaji}', Map(i): '${getKanaRomajiMapInternal()["い"]}'`)
    }

    romaji += charRomaji
    if (!usedGroups.includes(randomGroup.id)) {
      usedGroups.push(randomGroup.id)
    }
  }

  if (!kana) return null

  return {
    kana,
    romaji,
    type: wordType ?? targetType,
    groups: usedGroups,
  }
}
