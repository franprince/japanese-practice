/** Own vocabulary acquisition and the existing process-lifetime filtered cache. */
import { loadWordSets, normalizeLang, isMobileDevice } from "../wordsets"
import { getCharacterGroups } from "../shared/kana-dictionary-loader"
import { kanaToRomaji } from "./romaji"
import { buildFilterKey, clampWordsetForMobile, filterWordPool, selectWordPool } from "./filtering"
import type { GameMode } from "@/types/game"
import type { JapaneseWord, WordFilter } from "@/types/japanese"

const filteredWordCache = new Map<string, JapaneseWord[]>()
const hasHiragana = (text: string) => /[\u3040-\u309F]/.test(text)
const hasKatakana = (text: string) => /[\u30A0-\u30FF]/.test(text)

export async function getRandomWord(
  type: GameMode,
  filter?: WordFilter,
  lang?: "en" | "es" | "ja",
): Promise<JapaneseWord | null> {

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
    const error = err as any

    if (error?.code === "MOBILE_AUTH_REQUIRED" || error?.message?.includes("Wordset fetch blocked")) {

      if (!error.code) error.code = "MOBILE_AUTH_REQUIRED"
      throw error
    }
    throw err
  }

  let words = selectWordPool(wordSets, type)

  const datasetLang = normalizeLang(lang)
  const mobile = isMobileDevice()
  const cacheKey = buildFilterKey(type, filter, datasetLang, mobile)
  const cached = filteredWordCache.get(cacheKey)

  if (cached) {
    words = cached
  } else {

    words = clampWordsetForMobile(filterWordPool(words, filter), isMobileDevice())
    filteredWordCache.set(cacheKey, words)
  }

  if (words.length === 0) return null
  const choice = words[Math.floor(Math.random() * words.length)]
  return choice ?? null
}
