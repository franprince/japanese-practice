/** Validate complete persisted/downloaded datasets without changing their contents. */
import type { WordSets } from "./contracts"
import { WordsetError } from "./errors"

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
export function validateWordset(value: unknown): WordSets {
  if (!object(value) || !Number.isSafeInteger(value.version) || Number(value.version) <= 0 ||
    (value.assetChecksum !== undefined && (typeof value.assetChecksum !== "string" || !/^[a-f0-9]{64}$/.test(value.assetChecksum)))) {
    throw new WordsetError("validation")
  }
  for (const key of ["hiraganaWords", "katakanaWords", "bothForms"]) {
    const words = value[key]
    if (key === "bothForms" && words === undefined) continue
    if (!Array.isArray(words)) throw new WordsetError("validation")
    for (const word of words) {
      if (!object(word) || typeof word.kana !== "string" || !word.kana.trim() ||
        typeof word.romaji !== "string" ||
        (!word.romaji.trim() && !(word.romaji === "" && /^[ゝゞゐゑヽヾヰヱー]$/.test(word.kana) && Array.isArray(word.groups) && word.groups.length === 0)) ||
        (word.type !== "hiragana" && word.type !== "katakana") ||
        !Array.isArray(word.groups) || !word.groups.every(group => typeof group === "string") ||
        ["meaning", "kanji"].some(field => word[field] !== undefined && typeof word[field] !== "string") ||
        (word.length !== undefined && (!Number.isSafeInteger(word.length) || Number(word.length) < 0))) {
        throw new WordsetError("validation")
      }
    }
  }
  return value as WordSets
}
