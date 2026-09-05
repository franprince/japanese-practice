import type { JapaneseWord, CharacterGroup } from "./japanese"


export type LoaderDeps = {
    characterGroups: CharacterGroup[]
    kanaToRomaji: (text: string) => string
    hasHiragana: (text: string) => boolean
    hasKatakana: (text: string) => boolean
}


export type WordSets = {
    version: number
    /** Checksum of the static asset; absent on legacy cache entries. */
    assetChecksum?: string
    hiraganaWords: JapaneseWord[]
    katakanaWords: JapaneseWord[]
    bothForms?: JapaneseWord[]
}
