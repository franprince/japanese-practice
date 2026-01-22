/**
 * Japanese word with kana, romaji, and metadata
 */
export interface JapaneseWord {
    kana: string
    romaji: string
    type: "hiragana" | "katakana"
    meaning?: string
    groups: string[]
    kanji?: string
    length?: number
}

/**
 * Filter criteria for selecting words
 */
export interface WordFilter {
    selectedGroups: string[]
    minLength: number
    maxLength: number
}

/**
 * Character group from kana dictionary
 */
export interface CharacterGroup {
    id: string
    label: string
    labelJp: string
    type: "hiragana" | "katakana"
    characters: string[]
}

/**
 * Date game question
 */
export interface DateQuestion {
    display: string
    displayName: string
    displayNumber?: string
    answer: string
    romaji: string
    kanji?: string
}

/**
 * Date game mode
 */
export type DateMode = "months" | "full" | "week_days"

/**
 * Number game difficulty
 */
export type NumberDifficulty = "easy" | "medium" | "hard" | "expert"

/**
 * Kanji entry with metadata
 */
export interface KanjiEntry {
    char: string
    meaning_en?: string
    meaning_es?: string
    reading?: string
    jlpt?: string
}

/**
 * Kanji game difficulty
 */
export type KanjiDifficulty = "easy" | "medium" | "hard"

/**
 * Result for a single character in error detection
 */
export interface CharacterResult {
    kana: string
    expectedRomaji: string[]
    userInput: string
    isCorrect: boolean
}

/**
 * Complete error detection result
 */
export interface ErrorDetectionResult {
    isFullyCorrect: boolean
    characters: CharacterResult[]
    correctCount: number
    incorrectCount: number
    extraInput: string
}
