// Japanese number characters and their readings
export const japaneseNumbers = {
    // Basic digits 0-10
    〇: { reading: "zero", value: 0 },
    零: { reading: "rei", value: 0 },
    一: { reading: "ichi", value: 1 },
    二: { reading: "ni", value: 2 },
    三: { reading: "san", value: 3 },
    四: { reading: "yon", altReading: "shi", value: 4 },
    五: { reading: "go", value: 5 },
    六: { reading: "roku", value: 6 },
    七: { reading: "nana", altReading: "shichi", value: 7 },
    八: { reading: "hachi", value: 8 },
    九: { reading: "kyuu", altReading: "ku", value: 9 },
    十: { reading: "juu", value: 10 },
    百: { reading: "hyaku", value: 100 },
    千: { reading: "sen", value: 1000 },
    万: { reading: "man", value: 10000 },
} as const

// Number pad keys for input
export const numberPadKeysKanji = [
    { char: "一", value: "一" },
    { char: "二", value: "二" },
    { char: "三", value: "三" },
    { char: "四", value: "四" },
    { char: "五", value: "五" },
    { char: "六", value: "六" },
    { char: "七", value: "七" },
    { char: "八", value: "八" },
    { char: "九", value: "九" },
    { char: "十", value: "十" },
    { char: "百", value: "百" },
    { char: "千", value: "千" },
    { char: "万", value: "万" },
    { char: "〇", value: "〇" },
] as const

export const numberPadKeysArabic = [
    { char: "1", value: "1" },
    { char: "2", value: "2" },
    { char: "3", value: "3" },
    { char: "4", value: "4" },
    { char: "5", value: "5" },
    { char: "6", value: "6" },
    { char: "7", value: "7" },
    { char: "8", value: "8" },
    { char: "9", value: "9" },
    { char: "0", value: "0" },
] as const

// Function to convert Arabic number to Japanese
export function arabicToJapanese(num: number): string {
    if (num === 0) return "〇"
    if (num < 0) return ""

    let result = ""
    let remaining = num

    // 万 (10000s)
    if (remaining >= 10000) {
        const manCount = Math.floor(remaining / 10000)
        if (manCount > 1) {
            result += arabicToJapaneseSmall(manCount)
        }
        result += "万"
        remaining %= 10000
    }

    // 千 (1000s)
    if (remaining >= 1000) {
        const senCount = Math.floor(remaining / 1000)
        if (senCount > 1) {
            result += arabicToJapaneseSmall(senCount)
        }
        result += "千"
        remaining %= 1000
    }

    // 百 (100s)
    if (remaining >= 100) {
        const hyakuCount = Math.floor(remaining / 100)
        if (hyakuCount > 1) {
            result += arabicToJapaneseSmall(hyakuCount)
        }
        result += "百"
        remaining %= 100
    }

    // 十 (10s)
    if (remaining >= 10) {
        const juuCount = Math.floor(remaining / 10)
        if (juuCount > 1) {
            result += arabicToJapaneseSmall(juuCount)
        }
        result += "十"
        remaining %= 10
    }

    // Units (1-9)
    if (remaining > 0) {
        result += arabicToJapaneseSmall(remaining)
    }

    return result
}

function arabicToJapaneseSmall(num: number): string {
    const digits = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"]
    return digits[num] || ""
}

// Function to convert Japanese number string to Arabic
export function japaneseToArabic(japanese: string): number {
    if (japanese === "〇" || japanese === "零") return 0
    if (!japanese) return -1

    let total = 0
    let current = 0
    let manPart = 0

    for (const char of japanese) {
        switch (char) {
            case "一":
                current = 1
                break
            case "二":
                current = 2
                break
            case "三":
                current = 3
                break
            case "四":
                current = 4
                break
            case "五":
                current = 5
                break
            case "六":
                current = 6
                break
            case "七":
                current = 7
                break
            case "八":
                current = 8
                break
            case "九":
                current = 9
                break
            case "十":
                current = current === 0 ? 10 : current * 10
                total += current
                current = 0
                break
            case "百":
                current = current === 0 ? 100 : current * 100
                total += current
                current = 0
                break
            case "千":
                current = current === 0 ? 1000 : current * 1000
                total += current
                current = 0
                break
            case "万":
                current = current === 0 ? 1 : current
                manPart = (total + current) * 10000
                total = 0
                current = 0
                break
            case "〇":
            case "零":
                if (japanese.length === 1) return 0
                break
        }
    }

    return manPart + total + current
}

// Generate a random number within a range
export function generateRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// Difficulty presets
// Re-export type from centralized location
export type { NumberDifficulty } from "@/types/japanese"
// Backward compatibility alias
export type Difficulty = import("@/types/japanese").NumberDifficulty

export const difficultyRanges: Record<Difficulty, { min: number; max: number; label: string }> = {
    easy: { min: 1, max: 10, label: "1-10" },
    medium: { min: 1, max: 99, label: "1-99" },
    hard: { min: 1, max: 999, label: "1-999" },
    expert: { min: 1, max: 99999, label: "1-99999" },
}
