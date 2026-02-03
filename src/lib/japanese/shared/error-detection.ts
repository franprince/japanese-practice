import { normalizeRomaji, toMacronForm } from "./input"
import {
    getKanaRomajiMap,
    loadKanaDictionary,
} from "./kana-dictionary-loader"
import type { KanaGroup } from "@/types/kana"

import type { CharacterResult, ErrorDetectionResult } from "@/types/japanese"
export type { CharacterResult, ErrorDetectionResult } from "@/types/japanese"

let allRomajiMapCache: Record<string, string[]> | null = null

const GAP_CHAR = "\u0000"

async function getAllRomajiMap(): Promise<Record<string, string[]>> {
    if (allRomajiMapCache) return allRomajiMapCache

    const dictionary = await loadKanaDictionary()
    const map: Record<string, string[]> = {}

        ; (Object.values(dictionary) as Record<string, KanaGroup>[]).forEach(
            (groups) => {
                Object.values(groups).forEach((group: KanaGroup) => {
                    Object.entries(group.characters).forEach(([kana, romajiList]) => {
                        if (!map[kana]) {
                            map[kana] = Array.isArray(romajiList) ? [...romajiList] : []
                        } else {
                            const existing = map[kana]
                            if (existing) {
                                romajiList.forEach((r) => {
                                    if (!existing.includes(r)) {
                                        existing.push(r)
                                    }
                                })
                            }
                        }
                    })
                })
            }
        )

    allRomajiMapCache = map
    return map
}

export async function getValidRomaji(kana: string): Promise<string[]> {
    const map = await getAllRomajiMap()

    let suffix = ""
    let baseKana = kana
    if (kana.endsWith("ー") && kana !== "ー") {
        baseKana = kana.slice(0, -1)
        suffix = "ー"
    }

    const processBase = async (k: string): Promise<string[]> => {
        const firstChar = k[0]
        if ((firstChar === "っ" || firstChar === "ッ") && k.length > 1) {
            const followingKana = k.slice(1)
            const followingRomaji = map[followingKana] || await getValidRomaji(followingKana)

            if (followingRomaji && followingRomaji.length > 0) {
                return followingRomaji.map(romaji => {
                    const firstConsonant = romaji[0]
                    if (firstConsonant && /[bcdfghjklmnpqrstvwxyz]/i.test(firstConsonant)) {
                        return firstConsonant + romaji
                    }
                    return romaji
                })
            }
        }

        if (map[k]) return map[k]

        if (k.length === 1 && map[k]) return map[k]

        return []
    }

    let baseRomajiOptions = await processBase(baseKana)

    if (suffix === "ー" && baseRomajiOptions.length > 0) {
        const extendedOptions: string[] = []
        baseRomajiOptions.forEach(romaji => {
            const lastChar = romaji.slice(-1)
            let macron = ""
            let double = ""

            switch (lastChar) {
                case 'a': macron = 'ā'; double = 'aa'; break;
                case 'i': macron = 'ī'; double = 'ii'; break;
                case 'u': macron = 'ū'; double = 'uu'; break;
                case 'e': macron = 'ē'; double = 'ee'; break;
                case 'o': macron = 'ō'; double = 'oo'; break;
                default: break;
            }

            if (macron) {
                const stem = romaji.slice(0, -1)
                extendedOptions.push(stem + macron)
                extendedOptions.push(stem + double)
            } else {
                extendedOptions.push(romaji)
            }
        })
        return extendedOptions.length > 0 ? extendedOptions : baseRomajiOptions
    }

    if (baseRomajiOptions.length > 0) return baseRomajiOptions

    if (kana === "っ" || kana === "ッ") {
        return []
    }

    let result = ""
    const singleMap = await getKanaRomajiMap()
    for (const char of kana) {
        if (char === "ー") continue
        result += singleMap[char] || ""
    }

    return result ? [result] : []
}

export function tokenizeKana(kana: string): string[] {
    const tokenRegex = /[っッ][^っッー][ャュョゃゅょァィゥェォぁぃぅぇぉ]*ー?|[^っッー][ャュョゃゅょァィゥェォぁぃぅぇぉ]*ー?|[っッ]/g
    return kana.match(tokenRegex) || []
}

function alignStrings(expected: string, actual: string): { expectedAligned: string; actualAligned: string } {
    const m = expected.length
    const n = actual.length

    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) {
        const row = dp[i]
        if (row) row[0] = i
    }
    for (let j = 0; j <= n; j++) {
        const row = dp[0]
        if (row) row[j] = j
    }

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const row = dp[i]
            const prevRow = dp[i - 1]
            if (!row || !prevRow) continue

            if (expected[i - 1] === actual[j - 1]) {
                row[j] = prevRow[j - 1] ?? 0
            } else {
                row[j] = 1 + Math.min(
                    prevRow[j] ?? 0,
                    row[j - 1] ?? 0,
                    prevRow[j - 1] ?? 0
                )
            }
        }
    }

    let expectedAligned = ""
    let actualAligned = ""
    let i = m, j = n

    while (i > 0 || j > 0) {
        const row = dp[i]
        const prevRow = dp[i - 1]
        const currentVal = row?.[j] ?? 0
        const diagVal = prevRow?.[j - 1] ?? 0
        const leftVal = row?.[j - 1] ?? 0

        if (i > 0 && j > 0 && expected[i - 1] === actual[j - 1]) {
            expectedAligned = expected[i - 1] + expectedAligned
            actualAligned = actual[j - 1] + actualAligned
            i--; j--
        } else if (i > 0 && j > 0 && currentVal === diagVal + 1) {
            expectedAligned = expected[i - 1] + expectedAligned
            actualAligned = actual[j - 1] + actualAligned
            i--; j--
        } else if (j > 0 && currentVal === leftVal + 1) {
            expectedAligned = GAP_CHAR + expectedAligned
            actualAligned = actual[j - 1] + actualAligned
            j--
        } else if (i > 0) {
            expectedAligned = expected[i - 1] + expectedAligned
            actualAligned = GAP_CHAR + actualAligned
            i--
        }
    }

    return { expectedAligned, actualAligned }
}

function mapAlignmentToTokens(
    tokens: string[],
    expectedRomajiList: string[],
    expectedAligned: string,
    actualAligned: string
): { matches: string[]; extraInput: string } {
    const matches: string[] = []
    let alignedPos = 0

    for (let tokenIdx = 0; tokenIdx < tokens.length; tokenIdx++) {
        const expectedRomaji = expectedRomajiList[tokenIdx] || ""
        const romajiLen = expectedRomaji.length

        if (romajiLen === 0) {
            matches.push("")
            continue
        }

        let expectedCharsFound = 0
        let userSegment = ""

        while (expectedCharsFound < romajiLen && alignedPos < expectedAligned.length) {
            const expChar = expectedAligned[alignedPos]
            const actChar = actualAligned[alignedPos]

            if (expChar !== GAP_CHAR) {
                expectedCharsFound++
            }
            if (actChar !== GAP_CHAR) {
                userSegment += actChar
            }
            alignedPos++
        }

        matches.push(userSegment)
    }

    let extraInput = ""
    while (alignedPos < actualAligned.length) {
        const actChar = actualAligned[alignedPos]
        if (actChar !== GAP_CHAR) {
            extraInput += actChar
        }
        alignedPos++
    }

    return { matches, extraInput }
}

async function getContextualRomaji(token: string, prevToken?: string): Promise<string[]> {
    const validRomaji = await getValidRomaji(token)

    if (token === "ー" && prevToken) {
        const prevRomajis = await getValidRomaji(prevToken)
        if (prevRomajis.length > 0) {
            const firstPrev = prevRomajis[0]
            const lastChar = firstPrev ? firstPrev.slice(-1) : ""
            if (["a", "i", "u", "e", "o"].includes(lastChar)) {
                return [lastChar]
            }
        }
        return ["-"]
    }

    return validRomaji
}

function expandMacrons(text: string): string {
    return text
        .replace(/ā/g, "aa")
        .replace(/ī/g, "ii")
        .replace(/ū/g, "uu")
        .replace(/ē/g, "ee")
        .replace(/ō/g, "ou")
}

async function matchUserInputToTokens(
    tokens: string[],
    userInput: string
): Promise<{ segments: string[]; extraInput: string }> {
    const normalizedInput = userInput.toLowerCase().trim()
    const expandedInput = expandMacrons(normalizedInput)

    const expectedRomajiList: string[] = []
    let expectedRomaji = ""

    for (const token of tokens) {
        const validRomaji = await getValidRomaji(token)
        const primary = validRomaji[0] || ""
        const expandedPrimary = expandMacrons(primary)
        expectedRomajiList.push(expandedPrimary)
        expectedRomaji += expandedPrimary
    }

    const { expectedAligned, actualAligned } = alignStrings(expectedRomaji, expandedInput)

    const { matches, extraInput } = mapAlignmentToTokens(tokens, expectedRomajiList, expectedAligned, actualAligned)
    return { segments: matches, extraInput }
}

export async function detectErrors(
    kanaWord: string,
    userInput: string
): Promise<ErrorDetectionResult> {
    if (!kanaWord) {
        return {
            isFullyCorrect: false,
            characters: [],
            correctCount: 0,
            incorrectCount: 0,
            extraInput: "",
        }
    }

    const tokens = tokenizeKana(kanaWord)
    const { segments: userSegments, extraInput } = await matchUserInputToTokens(tokens, userInput)

    const characters: CharacterResult[] = await Promise.all(
        tokens.map(async (kana, i) => {
            const expectedRomaji = await getContextualRomaji(kana, i > 0 ? tokens[i - 1] : undefined)
            const userSegment = userSegments[i] || ""

            const isCorrect =
                expectedRomaji.length > 0 &&
                expectedRomaji.some(
                    (r) =>
                        toMacronForm(normalizeRomaji(r.toLowerCase())) ===
                        toMacronForm(normalizeRomaji(userSegment.toLowerCase()))
                )

            return {
                kana,
                expectedRomaji,
                userInput: userSegment,
                isCorrect,
            }
        })
    )

    const correctCount = characters.filter((c) => c.isCorrect).length
    const incorrectCount = characters.filter((c) => !c.isCorrect).length
    const hasExtraInput = extraInput.length > 0

    return {
        isFullyCorrect: characters.every((c) => c.isCorrect) && !hasExtraInput,
        characters,
        correctCount,
        incorrectCount,
        extraInput,
    }
}
