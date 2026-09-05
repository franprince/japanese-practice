
import type { JapaneseWord } from "@/types/japanese"


function normalizeRomajiCore(text: string): string {
    if (!text) return ""
    let norm = text.toLowerCase().trim()

    const replacements: Record<string, string> = {
        
        "sha": "sha", "shu": "shu", "sho": "sho",
        "cha": "cha", "chu": "chu", "cho": "cho",
        "sya": "sha", "syu": "shu", "syo": "sho",
        "tya": "cha", "tyu": "chu", "tyo": "cho",
        "zya": "ja", "zyu": "ju", "zyo": "jo",

        
        "si": "shi",
        "ti": "chi",
        "tu": "tsu",
        "hu": "fu",
        "zi": "ji",
        "di": "ji", 
        
    }

    
    

    let result = ""
    let i = 0
    while (i < norm.length) {
        let matched = false
        
        const tri = norm.slice(i, i + 3)
        if (replacements[tri]) {
            result += replacements[tri]
            i += 3
            matched = true
            continue
        }

        
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

    return norm
}


export function normalizeRomaji(text: string): string {
    return normalizeRomajiCore(text).replace(/nn/g, "n")
}


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

    if (rawInput === rawAnswer) return true

    const normInput = normalizeRomajiCore(rawInput)
    const normAnswer = normalizeRomajiCore(rawAnswer)

    if (normInput === normAnswer) return true

    // Forgive an accidental extra "n" after ん (e.g. "shinnkansen" for
    // "shinkansen"), but only when the correct answer doesn't itself rely
    // on a genuine doubled "nn" (e.g. "anna" for あんな) — collapsing
    // unconditionally here would accept "ana" as correct for あんな.
    if (!normAnswer.includes("nn")) {
        const collapsedInput = normInput.replace(/nn/g, "n")
        if (collapsedInput === normAnswer) return true
    }

    const macronInput = toMacronForm(normInput)
    const macronAnswer = toMacronForm(normAnswer)

    if (macronInput === macronAnswer) return true

    
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
