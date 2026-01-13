export type KanaEntryMap = Record<string, string[]>

export interface KanaGroup {
    characters: KanaEntryMap
}

export interface KanaDictionary {
    hiragana: Record<string, KanaGroup>
    katakana: Record<string, KanaGroup>
}
