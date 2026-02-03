
export interface JapaneseWord {
    kana: string
    romaji: string
    type: "hiragana" | "katakana"
    meaning?: string
    groups: string[]
    kanji?: string
    length?: number
}


export interface WordFilter {
    selectedGroups: string[]
    minLength: number
    maxLength: number
}


export interface CharacterGroup {
    id: string
    label: string
    labelJp: string
    type: "hiragana" | "katakana"
    characters: string[]
}


export interface DateQuestion {
    display: string
    displayName: string
    displayNumber?: string
    answer: string
    romaji: string
    kanji?: string
}


export type DateMode = "months" | "full" | "week_days"


export type NumberDifficulty = "easy" | "medium" | "hard" | "expert"


export interface KanjiEntry {
    char: string
    meaning_en?: string
    meaning_es?: string
    reading?: string
    jlpt?: string
}


export type KanjiDifficulty = "easy" | "medium" | "hard"


export interface CharacterResult {
    kana: string
    expectedRomaji: string[]
    userInput: string
    isCorrect: boolean
}


export interface ErrorDetectionResult {
    isFullyCorrect: boolean
    characters: CharacterResult[]
    correctCount: number
    incorrectCount: number
    extraInput: string
}
