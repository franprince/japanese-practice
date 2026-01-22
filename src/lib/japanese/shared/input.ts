
import type { JapaneseWord } from "@/types/japanese"

/**
 * Normalizes romanization variations to a standard form (Hepburn-ish) for comparison.
 * Handles common variations like:
 * - si -> shi
 * - tu -> tsu
 * - ti -> chi
 * - hu -> fu
 */
export function normalizeRomaji(text: string): string {
    if (!text) return ""
    let norm = text.toLowerCase().trim()

    // Sokuon / Geminate consonats: reduce double consonants for easier comparison if needed?
    // Actually, standardizing input like 'chi' vs 'ti' is key.

    // Direct Replacements (Kunrei-shiki/Nihon-shiki -> Hepburn)
    // Order matters: longer matches first
    const replacements: Record<string, string> = {
        // Digraphs
        "sha": "sha", "shu": "shu", "sho": "sho",
        "cha": "cha", "chu": "chu", "cho": "cho",
        "sya": "sha", "syu": "shu", "syo": "sho",
        "tya": "cha", "tyu": "chu", "tyo": "cho",
        "zya": "ja", "zyu": "ju", "zyo": "jo",

        // Singles
        "si": "shi",
        "ti": "chi",
        "tu": "tsu",
        "hu": "fu",
        "zi": "ji",
        "di": "ji", // sometimes 'di' -> 'ji' (ヂ) though 'dji' or 'di' might be distinct in some contexts. 
        // For standard kana mapping usually じ/ji and ぢ/ji (read as ji).
    }

    // Iterate relative to string to ensure we pick longest match first 
    // and advance cursor, avoiding "syu" -> "hu" match inside it.

    let result = ""
    let i = 0
    while (i < norm.length) {
        let matched = false
        // Check for 3-char match
        const tri = norm.slice(i, i + 3)
        if (replacements[tri]) {
            result += replacements[tri]
            i += 3
            matched = true
            continue
        }

        // Check for 2-char match
        const bi = norm.slice(i, i + 2)
        if (replacements[bi]) {
            result += replacements[bi]
            i += 2
            matched = true
            continue
        }

        if (!matched) {
            result += norm[i]
            i++
        }
    }
    norm = result

    // Normalize 'n' usage? 
    // 'nn' -> 'n' at end or before consonants is common confusion.
    // 'shinkansen' vs 'shinkansen'.
    // Let's remove double 'n's to single 'n' for comparison, 
    // UNLESS the answer specifically requires specific n rules.
    // Ideally 'n' followed by vowel is 'n'+vowel. 
    // 'n' at end is just 'n'.
    // 'nn' is often typed for ん.
    // Let's crush 'nn' to 'n'.
    norm = norm.replace(/nn/g, "n")

    return norm
}

export function validateAnswer(input: string, word: JapaneseWord): boolean {
    if (!input || !word) return false

    const normalizedInput = input.toLowerCase().trim()
    const normalizedAnswer = word.romaji.toLowerCase().trim()
    const kana = word.kana

    // 1. Exact match (standard check)
    if (normalizedInput === normalizedAnswer) return true

    // 2. Normalize Romanization (handle si/shi, tu/tsu, etc.)
    const normInput = normalizeRomaji(normalizedInput)
    const normAnswer = normalizeRomaji(normalizedAnswer)

    if (normInput === normAnswer) return true

    // 3. Particle Exceptions (Contextual)
    // Check if the word *ends* with a particle that has special reading.
    // Commonly: 
    // は (ha) -> read as 'wa'
    // へ (he) -> read as 'e'
    // を (wo) -> read as 'o'

    const particleMap: Record<string, string> = {
        "は": "wa",
        "へ": "e",
        "を": "o"
    }

    // We check if the answer ends with the "raw" romanization of the particle 
    // AND the user typed the "sound" of the particle.

    // Reverse map for checking the romanization tail
    const romajiTailMap: Record<string, string> = {
        "wa": "ha",
        "e": "he",
        "o": "wo"
    }

    // Check "wa" (input) vs "ha" (answer) for 'は'
    if (kana.endsWith("は") && normAnswer.endsWith("ha") && normInput.endsWith("wa")) {
        const stem = normAnswer.slice(0, -2) // remove 'ha'
        // Check if input matches stem + 'wa'
        if (normInput === stem + "wa") return true
    }

    // Check "e" (input) vs "he" (answer) for 'へ'
    if (kana.endsWith("へ") && normAnswer.endsWith("he") && normInput.endsWith("e")) {
        const stem = normAnswer.slice(0, -2)
        if (normInput === stem + "e") return true
    }

    // Check "o" (input) vs "wo" (answer) for 'を'
    if (kana.endsWith("を") && normAnswer.endsWith("wo") && normInput.endsWith("o")) {
        const stem = normAnswer.slice(0, -2)
        if (normInput === stem + "o") return true
    }

    return false
}
