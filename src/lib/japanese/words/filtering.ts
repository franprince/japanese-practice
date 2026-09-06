/** Candidate composition, filtering and cache keys; never mutates source data. */
import { blacklist } from "../shared/blacklist"
import { shuffleArray } from "@/lib/core/random"
import type { GameMode } from "@/types/game"
import type { JapaneseWord, WordFilter } from "@/types/japanese"
import type { WordSets } from "@/types/api"

const MOBILE_WORDSET_MAX = 1500

export const buildFilterKey = (type: GameMode, filter: WordFilter | undefined, lang: string, isMobile: boolean) => {
  if (!filter) return `${type}:${lang}:${isMobile ? "mobile" : "desktop"}:none`
  const sortedGroups = [...filter.selectedGroups].sort()
  return `${type}:${lang}:${isMobile ? "mobile" : "desktop"}:${filter.minLength}-${filter.maxLength}:${sortedGroups.join("|")}`
}

export const clampWordsetForMobile = (words: JapaneseWord[], mobile: boolean, random: () => number = Math.random) => {
  if (!mobile || words.length <= MOBILE_WORDSET_MAX) return words
  return shuffleArray(words, random).slice(0, MOBILE_WORDSET_MAX)
}

const isMeaningBlacklisted = (meaning?: string) => {
  if (!meaning) return false
  const lowerMeaning = meaning.toLowerCase()
  return blacklist.some(term => term.trim() && lowerMeaning.includes(term.toLowerCase()))
}

export function selectWordPool(wordSets: WordSets, type: GameMode): JapaneseWord[] {
  const { hiraganaWords, katakanaWords, bothForms } = wordSets
  if (type === "hiragana") return hiraganaWords
  if (type === "katakana") return katakanaWords
  return [...hiraganaWords, ...katakanaWords, ...(bothForms ?? [])]
}

export function filterWordPool(words: JapaneseWord[], filter?: WordFilter): JapaneseWord[] {
  return words.filter(word => {
    if (isMeaningBlacklisted(word.meaning)) return false
    if (!filter) return true
    if (word.kana.length < filter.minLength || word.kana.length > filter.maxLength) return false
    if (filter.selectedGroups.length === 0) return false
    return word.groups.every(group => filter.selectedGroups.includes(group))
  })
}
