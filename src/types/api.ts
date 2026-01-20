import type { JapaneseWord, CharacterGroup } from "./japanese"

/**
 * Dependencies for word loader
 */
export type LoaderDeps = {
    characterGroups: CharacterGroup[]
    kanaToRomaji: (text: string) => string
    hasHiragana: (text: string) => boolean
    hasKatakana: (text: string) => boolean
}

/**
 * Loaded word sets
 */
export type WordSets = {
    version: number
    hiraganaWords: JapaneseWord[]
    katakanaWords: JapaneseWord[]
    bothForms?: JapaneseWord[]
}
