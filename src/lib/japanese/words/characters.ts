/** Dictionary-backed character sampling and its script/group policies. */
import { getCharacterGroups, getCharacterGroupsSync, getKanaRomajiMap } from "../shared/kana-dictionary-loader"
import { convertKanaToRomaji } from "./romaji"
import type { GameMode } from "@/types/game"
import type { CharacterGroup, JapaneseWord, WordFilter } from "@/types/japanese"

// Retain the historical import-time snapshot; async callers load current groups.
export const characterGroups: CharacterGroup[] = getCharacterGroupsSync()

export async function getRandomCharacter(type: GameMode, filter?: WordFilter): Promise<JapaneseWord | null> {
  const groups = await getCharacterGroups()
  const map = await getKanaRomajiMap()
  return generateCharacters(type, filter, groups, map)
}

export function generateCharacters(
  type: GameMode, filter: WordFilter | undefined,
  loadedCharacterGroups: CharacterGroup[], kanaRomajiMap: Record<string, string>,
  random: () => number = Math.random,
): JapaneseWord | null {
  const modeToType = (mode: GameMode): "hiragana" | "katakana" =>
    mode === "katakana" ? "katakana"
      : mode === "both" ? (random() > 0.5 ? "hiragana" : "katakana")
        : "hiragana"

  const selectedTypes = (filter?.selectedGroups ?? [])
    .map(id => loadedCharacterGroups.find(g => g.id === id)?.type)
    .filter((t): t is "hiragana" | "katakana" => Boolean(t))
  const hasH = selectedTypes.includes("hiragana")
  const hasK = selectedTypes.includes("katakana")

  const allowMixed = type === "both" && (filter?.selectedGroups?.length ? hasH && hasK : true)

  let targetType: "hiragana" | "katakana" = modeToType(type)
  if (!allowMixed && filter?.selectedGroups && filter.selectedGroups.length > 0) {
    targetType = hasK && !hasH ? "katakana" : hasH && !hasK ? "hiragana" : modeToType(type)
  }

  let groups = allowMixed
    ? loadedCharacterGroups
    : loadedCharacterGroups.filter((g) => g.type === targetType)

  if (filter?.selectedGroups !== undefined) {
    if (filter.selectedGroups.length === 0) return null
    groups = groups.filter((g) => filter.selectedGroups.includes(g.id))
  }

  if (filter?.selectedGroups) {
    const totalGroups = loadedCharacterGroups.filter((g) => g.type === targetType).length
    const selectedCount = filter.selectedGroups.filter(id => {
      const group = loadedCharacterGroups.find(g => g.id === id)
      return group?.type === targetType
    }).length
    const selectionRatio = selectedCount / totalGroups

    if (selectionRatio > 0.5) {
      const specialGroupPattern = /^h(1[6-9]|2[0-6])_a$|^k(1[8-9]|[2-3][0-9])_a$/

      groups = groups.filter(g => {
        const isSpecialGroup = specialGroupPattern.test(g.id)
        if (isSpecialGroup) {

          return random() < 0.4
        }
        return true
      })
    }
  }

  if (groups.length === 0) return null

  const length = filter?.minLength
    ? Math.floor(random() * (filter.maxLength - filter.minLength + 1)) + filter.minLength
    : 1

  let kana = ""
  let romaji = ""
  const usedGroups: string[] = []
  let wordType: "hiragana" | "katakana" | undefined

  for (let i = 0; i < length; i++) {
    const randomGroup = groups[Math.floor(random() * groups.length)]
    if (!randomGroup) break

    const char = randomGroup.characters[Math.floor(random() * randomGroup.characters.length)]
    if (!char) continue

    kana += char
    const charRomaji = convertKanaToRomaji(char, kanaRomajiMap)

    if (!wordType) {
      wordType = randomGroup.type as "hiragana" | "katakana"
    }

    if (char === "い" && charRomaji !== "i") {
      console.warn(`[Suspicious Romaji] Char: ${char}, Mapped: '${charRomaji}', Map(i): '${kanaRomajiMap["い"]}'`)
    }

    romaji += charRomaji
    if (!usedGroups.includes(randomGroup.id)) {
      usedGroups.push(randomGroup.id)
    }
  }

  if (!kana) return null

  return {
    kana,
    romaji,
    type: wordType ?? targetType,
    groups: usedGroups,
  }
}
