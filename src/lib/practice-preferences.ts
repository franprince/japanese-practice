import type { GameMode, WordsGameType } from "@/types/game"
import type { WordFilter } from "@/lib/japanese/words"
export type PracticeKind = "words" | "numbers" | "dates" | "kanji"
export interface CommonPracticeSettings {
  version: 1
  playMode: "session" | "infinite"
  targetCount: number
}
export interface WordsPracticeSettings extends CommonPracticeSettings {
  mode: GameMode
  gameType: WordsGameType | null
  filter: WordFilter | null
}
export interface NumbersPracticeSettings extends CommonPracticeSettings {
  difficulty: "easy" | "medium" | "hard" | "expert"
  mode: "arabicToKanji" | "kanjiToArabic"
}
export interface DatesPracticeSettings extends CommonPracticeSettings {
  mode: "week_days" | "months" | "full"
}
export interface KanjiPracticeSettings extends CommonPracticeSettings {
  difficulty: "easy" | "medium" | "hard"
}
export interface PracticeSettingsByKind {
  words: WordsPracticeSettings
  numbers: NumbersPracticeSettings
  dates: DatesPracticeSettings
  kanji: KanjiPracticeSettings
}
const common = { version: 1, playMode: "session", targetCount: 10 } as const
export const practiceDefaults: PracticeSettingsByKind = {
  words: { ...common, mode: "hiragana", gameType: null, filter: null },
  numbers: { ...common, difficulty: "easy", mode: "arabicToKanji" },
  dates: { ...common, mode: "week_days" },
  kanji: { ...common, difficulty: "easy" },
}
export const beginnerSettings: WordsPracticeSettings = {
  ...common,
  targetCount: 5,
  mode: "hiragana",
  gameType: "guess",
  filter: null,
}
export const practiceKey = (kind: PracticeKind) => `practice-settings-${kind}-v1`
export function isPracticeSettings(kind: PracticeKind, value: unknown): boolean {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  if (v.version !== 1 || !["session", "infinite"].includes(v.playMode as string) || !Number.isInteger(v.targetCount) || Number(v.targetCount) < 1 || Number(v.targetCount) > 50) return false
  if (kind === "numbers") return ["easy", "medium", "hard", "expert"].includes(v.difficulty as string) && ["arabicToKanji", "kanjiToArabic"].includes(v.mode as string)
  if (kind === "dates") return ["week_days", "months", "full"].includes(v.mode as string)
  if (kind === "kanji") return ["easy", "medium", "hard"].includes(v.difficulty as string)
  if (!["hiragana", "katakana", "both", "custom"].includes(v.mode as string) || (v.gameType !== null && !["words", "characters", "guess"].includes(v.gameType as string))) return false
  if (v.filter === null) return v.mode !== "custom"
  if (!v.filter || typeof v.filter !== "object") return false
  const f = v.filter as Record<string, unknown>
  return Array.isArray(f.selectedGroups) && f.selectedGroups.every(group => typeof group === "string") && (v.mode !== "custom" || f.selectedGroups.length > 0) && Number.isInteger(f.minLength) && Number.isInteger(f.maxLength) && Number(f.minLength) >= 1 && Number(f.maxLength) >= Number(f.minLength) && Number(f.maxLength) <= 100
}
