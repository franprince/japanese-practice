/** Select a playable question and Guess choices without UI or session effects. */
import type { GameMode, WordsGameType } from "@/types/game"
import type { JapaneseWord, WordFilter } from "@/types/japanese"
import type { Language } from "@/lib/i18n/translations"
import { shuffleArray } from "@/lib/core/random"
import { getRandomWord } from "./selection"
import { getRandomCharacter } from "./characters"

export interface WordQuestionRequest {
  mode: GameMode
  gameType: WordsGameType
  filter: WordFilter
  lang: Language
}
export interface WordQuestion {
  word: JapaneseWord | null
  options: string[] | null
  error?: unknown
}
interface SelectionDeps {
  word: typeof getRandomWord
  character: typeof getRandomCharacter
  random: () => number
}

export async function loadWordQuestion(
  { mode, gameType, filter, lang }: WordQuestionRequest,
  deps: SelectionDeps = { word: getRandomWord, character: getRandomCharacter, random: Math.random },
): Promise<WordQuestion> {
  let word: JapaneseWord | null = null
  try {
    const single = { ...filter, minLength: 1, maxLength: 1 }
    word = gameType === "words"
      ? await deps.word(mode, filter, lang)
      : await deps.character(mode, gameType === "guess" ? single : filter)
    if (!word || gameType !== "guess") return { word, options: null }

    const distractors: string[] = []
    for (let attempt = 0; attempt < 10 && distractors.length < 2; attempt++) {
      const candidate = await deps.character(mode, single)
      if (candidate && candidate.romaji !== word.romaji && !distractors.includes(candidate.romaji)) {
        distractors.push(candidate.romaji)
      }
    }
    const fallbacks = ["a", "i", "u", "e", "o", "ka", "ki", "ku", "ke", "ko"]
    while (distractors.length < 2) {
      const fallback = fallbacks[Math.floor(deps.random() * fallbacks.length)]!
      if (fallback !== word.romaji && !distractors.includes(fallback)) distractors.push(fallback)
    }
    return { word, options: shuffleArray([word.romaji, ...distractors], deps.random) }
  } catch (error) {
    // A failed distractor request historically retains the selected primary word.
    return { word, options: null, error }
  }
}
