import { normalizeRomaji, toMacronForm } from "./input"
import {
    getKanaRomajiMap,
    loadKanaDictionary,
} from "./kana-dictionary-loader"
import type { KanaDictionary, KanaGroup } from "@/types/kana"

// Import types from centralized location for use in this file
import type { CharacterResult, ErrorDetectionResult } from "@/types/japanese"

// Re-export types from centralized location
export type { CharacterResult, ErrorDetectionResult } from "@/types/japanese"

// Cache for all valid romaji mappings (kana -> all valid romaji)
let allRomajiMapCache: Record<string, string[]> | null = null

// Special character to represent gaps in alignment (using null character to avoid conflict with user input like hyphens)
const GAP_CHAR = "\u0000"

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
 * Handles chouonpu extensions like ター → tā, taa
 */
export async function getValidRomaji(kana: string): Promise<string[]> {
    const map = await getAllRomajiMap()

    // Handle chouonpu (ー) at the end
    let suffix = ""
    let baseKana = kana
    if (kana.endsWith("ー") && kana !== "ー") {
        baseKana = kana.slice(0, -1)
        suffix = "ー"
    }

    const processBase = async (k: string): Promise<string[]> => {
        // Handle sokuon (っ/ッ) + following character(s)
        const firstChar = k[0]
        if ((firstChar === "っ" || firstChar === "ッ") && k.length > 1) {
            const followingKana = k.slice(1)
            // Recursive call to handle nested structures if necessary, but map lookup is usually enough for the tail
            // Actually, sokuon usually prefixes a valid token.
            // But if we stripped 'ー', the tail might be valid.
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

        // Direct map lookup
        if (map[k]) return map[k]

        // Fallback for compound lookup failure
        if (k.length === 1 && map[k]) return map[k]

        // Try splitting if regex failed to group known digraph? 
        // But regex should match token.

        return []
    }

    let baseRomajiOptions = await processBase(baseKana)

    // If we have a suffix 'ー', extend the vowels
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
                case 'e': macron = 'ē'; double = 'ee'; break; // or ei? standard chouonpu is usually valid as ē.
                case 'o': macron = 'ō'; double = 'oo'; break; // or ou? default to oo for katakana chouonpu
                default: break;
            }

            if (macron) {
                const stem = romaji.slice(0, -1)
                extendedOptions.push(stem + macron)
                extendedOptions.push(stem + double)
            } else {
                // If no vowel, just append hyphen (fallback) or keep as is?
                // Usually invalid, just ignore
                extendedOptions.push(romaji)
            }
        })
        return extendedOptions.length > 0 ? extendedOptions : baseRomajiOptions
    }

    if (baseRomajiOptions.length > 0) return baseRomajiOptions

    // Handle standalone sokuon (unusual)
    if (kana === "っ" || kana === "ッ") {
        return []
    }

    // fallback manual construction
    let result = ""
    const singleMap = await getKanaRomajiMap()
    for (const char of kana) {
        if (char === "ー") continue // Skip isolated chouonpu if manual
        result += singleMap[char] || ""
    }

    return result ? [result] : []
}

/**
 * Tokenizes a kana string into individual characters/digraphs
 * Handles compound characters like きゃ, しゅ, ちょ, ティ
 * Handles sokuon combinations
 * Handles chouonpu (ー) attached to tokens
 */
export function tokenizeKana(kana: string): string[] {
    // Matches:
    // Sokuon/NotSokuon + optional small kana + optional ー
    // Includes expanded small kana list for Katakana (ァィゥェォ)
    const tokenRegex = /[っッ][^っッー][ャュョゃゅょァィゥェォぁぃぅぇぉ]*ー?|[^っッー][ャュョゃゅょァィゥェォぁぃぅぇぉ]*ー?|[っッ]/g
    return kana.match(tokenRegex) || []
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
            expectedAligned = GAP_CHAR + expectedAligned
            actualAligned = actual[j - 1] + actualAligned
            j--
        } else if (i > 0) {
            // Deletion from expected
            expectedAligned = expected[i - 1] + expectedAligned
            actualAligned = GAP_CHAR + actualAligned
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

    // Collect any remaining unmatched input (extra characters after all tokens matched)
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

/**
 * Matches user input segments to kana tokens using edit-distance alignment
 * This properly handles structural differences in input
 */
async function getContextualRomaji(token: string, prevToken?: string): Promise<string[]> {
    const validRomaji = await getValidRomaji(token)

    // Handle Chouonpu (ー)
    if (token === "ー" && prevToken) {
        const prevRomajis = await getValidRomaji(prevToken)
        if (prevRomajis.length > 0) {
            // Get the last character of the primary romaji for the previous token
            // e.g. "ne" -> "e", "shi" -> "i"
            const firstPrev = prevRomajis[0]
            const lastChar = firstPrev ? firstPrev.slice(-1) : ""
            // Check if it's a vowel (simple heuristic). 
            // Most valid romaji end in vowels or n. 
            // If n, then 'ー' is weird, but standard is vowel elongation.
            if (["a", "i", "u", "e", "o"].includes(lastChar)) {
                // Return vowel as primary, strictly enforcing vowel elongation
                return [lastChar]
            }
        }
        return ["-"] // Fallback
    }

    return validRomaji
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
        // We use the *first* (macron) form as the canonical alignment target
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
