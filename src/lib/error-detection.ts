import { normalizeRomaji } from "./japanese-input"
import {
    getKanaRomajiMap,
    loadKanaDictionary,
} from "./data/kana-dictionary-loader"
import type { KanaDictionary, KanaGroup } from "@/types/kana"

// Import types from centralized location for use in this file
import type { CharacterResult, ErrorDetectionResult } from "@/types/japanese"

// Re-export types from centralized location
export type { CharacterResult, ErrorDetectionResult } from "@/types/japanese"

// Cache for all valid romaji mappings (kana -> all valid romaji)
let allRomajiMapCache: Record<string, string[]> | null = null

/**
 * Builds a map of kana -> all valid romaji representations (not just the first one)
 */
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
                            // Merge any additional romaji variations
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

/**
 * Gets all valid romaji representations for a kana character/digraph
 * Handles sokuon combinations like っき → kki
 */
export async function getValidRomaji(kana: string): Promise<string[]> {
    const map = await getAllRomajiMap()

    // Handle sokuon (っ/ッ) + following character(s)
    const firstChar = kana[0]
    if ((firstChar === "っ" || firstChar === "ッ") && kana.length > 1) {
        const followingKana = kana.slice(1)
        const followingRomaji = map[followingKana]

        if (followingRomaji && followingRomaji.length > 0) {
            // Double the first consonant of each valid romaji
            return followingRomaji.map(romaji => {
                const firstConsonant = romaji[0]
                if (firstConsonant && /[bcdfghjklmnpqrstvwxyz]/i.test(firstConsonant)) {
                    return firstConsonant + romaji
                }
                return romaji
            })
        }
    }

    // Check for digraph first
    if (kana.length === 2 && map[kana]) {
        return map[kana]
    }

    // Check single character
    if (kana.length === 1 && map[kana]) {
        return map[kana]
    }

    // Handle standalone sokuon (unusual)
    if (kana === "っ" || kana === "ッ") {
        return []
    }

    // If not found, try to build from individual characters
    let result = ""
    const singleMap = await getKanaRomajiMap()
    for (const char of kana) {
        result += singleMap[char] || ""
    }

    return result ? [result] : []
}

/**
 * Checks if a two-character sequence is a digraph (combination kana)
 */
function isDigraph(twoChars: string): boolean {
    const smallY = ["ゃ", "ゅ", "ょ", "ャ", "ュ", "ョ"]
    const secondChar = twoChars[1]
    return twoChars.length === 2 && secondChar !== undefined && smallY.includes(secondChar)
}

/**
 * Tokenizes a kana string into individual characters/digraphs
 * Handles compound characters like きゃ, しゅ, ちょ
 * Combines sokuon (っ/ッ) with following character as single token
 */
export function tokenizeKana(kana: string): string[] {
    const tokens: string[] = []
    let i = 0

    while (i < kana.length) {
        const char = kana[i]

        // Handle sokuon (small tsu) - combine with following character(s)
        if (char === "っ" || char === "ッ") {
            if (i + 1 < kana.length) {
                // Check if next chars form a digraph
                if (i + 2 < kana.length) {
                    const nextDigraph = kana.slice(i + 1, i + 3)
                    if (isDigraph(nextDigraph)) {
                        tokens.push(char + nextDigraph) // e.g., っきゃ
                        i += 3
                        continue
                    }
                }
                // Combine with single next character
                const nextChar = kana[i + 1]
                if (nextChar !== undefined) {
                    tokens.push(char + nextChar) // e.g., っき
                    i += 2
                    continue
                }
            }
            // Sokuon at end of string (unusual but handle it)
            tokens.push(char)
            i += 1
            continue
        }

        // Check for digraph (2-character combo like きゃ, きゅ, きょ)
        if (i + 1 < kana.length) {
            const digraph = kana.slice(i, i + 2)
            if (isDigraph(digraph)) {
                tokens.push(digraph)
                i += 2
                continue
            }
        }

        // Single character
        if (char !== undefined) {
            tokens.push(char)
        }
        i += 1
    }

    return tokens
}

/**
 * Computes Levenshtein edit distance between two strings and returns the alignment
 * Uses dynamic programming with traceback to find the optimal character alignment
 */
function alignStrings(expected: string, actual: string): { expectedAligned: string; actualAligned: string } {
    const m = expected.length
    const n = actual.length

    // Create DP table
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

    // Initialize base cases
    for (let i = 0; i <= m; i++) {
        const row = dp[i]
        if (row) row[0] = i
    }
    for (let j = 0; j <= n; j++) {
        const row = dp[0]
        if (row) row[j] = j
    }

    // Fill DP table
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const row = dp[i]
            const prevRow = dp[i - 1]
            if (!row || !prevRow) continue

            if (expected[i - 1] === actual[j - 1]) {
                row[j] = prevRow[j - 1] ?? 0
            } else {
                row[j] = 1 + Math.min(
                    prevRow[j] ?? 0,     // deletion
                    row[j - 1] ?? 0,     // insertion
                    prevRow[j - 1] ?? 0  // substitution
                )
            }
        }
    }

    // Traceback to find alignment
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
            // Substitution
            expectedAligned = expected[i - 1] + expectedAligned
            actualAligned = actual[j - 1] + actualAligned
            i--; j--
        } else if (j > 0 && currentVal === leftVal + 1) {
            // Insertion in actual
            expectedAligned = "-" + expectedAligned
            actualAligned = actual[j - 1] + actualAligned
            j--
        } else if (i > 0) {
            // Deletion from expected
            expectedAligned = expected[i - 1] + expectedAligned
            actualAligned = "-" + actualAligned
            i--
        }
    }

    return { expectedAligned, actualAligned }
}

/**
 * Maps aligned romaji back to kana tokens to extract user input segments
 * Also tracks any extra input that wasn't matched to any kana
 */
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

        // Find where this token's romaji ends in the aligned string
        let expectedCharsFound = 0
        let userSegment = ""

        while (expectedCharsFound < romajiLen && alignedPos < expectedAligned.length) {
            const expChar = expectedAligned[alignedPos]
            const actChar = actualAligned[alignedPos]

            if (expChar !== "-") {
                expectedCharsFound++
            }
            if (actChar !== "-") {
                userSegment += actChar
            }
            alignedPos++
        }

        matches.push(userSegment)
    }

    // Collect any remaining unmatched input (extra characters after all tokens matched)
    let extraInput = ""
    while (alignedPos < actualAligned.length) {
        const actChar = actualAligned[alignedPos]
        if (actChar !== "-") {
            extraInput += actChar
        }
        alignedPos++
    }

    return { matches, extraInput }
}

/**
 * Matches user input segments to kana tokens using edit-distance alignment
 * This properly handles structural differences in input
 */
async function matchUserInputToTokens(
    tokens: string[],
    userInput: string
): Promise<{ segments: string[]; extraInput: string }> {
    const normalizedInput = userInput.toLowerCase().trim()

    // Build expected romaji string using getValidRomaji for each token
    const expectedRomajiList: string[] = []
    let expectedRomaji = ""

    for (const token of tokens) {
        // getValidRomaji handles all cases including sokuon+char combinations
        const validRomaji = await getValidRomaji(token)
        const primary = validRomaji[0] || ""
        expectedRomajiList.push(primary)
        expectedRomaji += primary
    }

    // Perform edit-distance alignment
    const { expectedAligned, actualAligned } = alignStrings(expectedRomaji, normalizedInput)

    // Map alignment back to tokens
    const { matches, extraInput } = mapAlignmentToTokens(tokens, expectedRomajiList, expectedAligned, actualAligned)
    return { segments: matches, extraInput }
}


/**
 * Detects errors in user romaji input compared to expected kana
 *
 * @param kanaWord - The expected kana word (e.g., "ぴゃぼでだ")
 * @param userInput - The user's romaji input (e.g., "pyaboteka")
 * @returns Detailed per-character error detection results
 *
 * @example
 * const result = await detectErrors('ぴゃぼでだ', 'pyaboteka')
 * // result.characters[0] = { kana: 'ぴゃ', isCorrect: true, ... }
 * // result.characters[2] = { kana: 'で', isCorrect: false, userInput: 'te', ... }
 */
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
            const expectedRomaji = await getValidRomaji(kana)
            const userSegment = userSegments[i] || ""

            const isCorrect =
                expectedRomaji.length > 0 &&
                expectedRomaji.some(
                    (r) =>
                        normalizeRomaji(r.toLowerCase()) ===
                        normalizeRomaji(userSegment.toLowerCase())
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
