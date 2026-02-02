
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

/**
 * Converts double vowels and 'ou' to macron form for standardized comparison
 * e.g., "arigatou" -> "arigatō", "suuji" -> "sūji"
 */
export function toMacronForm(text: string): string {
    if (!text) return ""
    return text.toLowerCase()
        .replace(/aa/g, "ā")
        .replace(/ii/g, "ī")
        .replace(/uu/g, "ū")
        .replace(/ee/g, "ē")
        .replace(/oo/g, "ō")
        .replace(/ou/g, "ō")
}

export function validateAnswer(input: string, word: JapaneseWord): boolean {
    if (!input || !word) return false

    const rawInput = input.toLowerCase().trim()
    const rawAnswer = word.romaji.toLowerCase().trim()
    const kana = word.kana

    // 1. Exact match
    if (rawInput === rawAnswer) return true

    // 2. Normalize Romanization (handle si/shi, etc.)
    const normInput = normalizeRomaji(rawInput)
    const normAnswer = normalizeRomaji(rawAnswer)

    if (normInput === normAnswer) return true

    // 3. Macron Normalization (The new robust check)
    // Convert both valid input styles (double vowel, macron) to a single standard
    // e.g. Input "suuji" -> "sūji" vs Answer "sūji" -> "sūji"
    const macronInput = toMacronForm(normInput)
    const macronAnswer = toMacronForm(normAnswer)

    if (macronInput === macronAnswer) return true

    // 4. Particle Exceptions (Contextual)
    const particleMap: Record<string, string> = {
        "は": "wa",
        "へ": "e",
        "を": "o"
    }

    if (kana.endsWith("は") && macronAnswer.endsWith("ha") && macronInput.endsWith("wa")) {
        const stem = macronAnswer.slice(0, -2)
        if (macronInput === stem + "wa") return true
    }

    if (kana.endsWith("へ") && macronAnswer.endsWith("he") && macronInput.endsWith("e")) {
        const stem = macronAnswer.slice(0, -2)
        if (macronInput === stem + "e") return true
    }

    if (kana.endsWith("を") && macronAnswer.endsWith("wo") && macronInput.endsWith("o")) {
        const stem = macronAnswer.slice(0, -2)
        if (macronInput === stem + "o") return true
    }

    return false
}
