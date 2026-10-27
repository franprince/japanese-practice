export type JMdictEntry = {
  kanji: string[]
  kana: string[]
  /** Search-only spellings: indexed for lookups, never displayed. */
  hidden: string[]
  common: boolean
  senses: { pos: string[]; gloss: string[]; notes: string[] }[]
}
export function parseJMdict(xml: string): { date: string; entries: JMdictEntry[] }
