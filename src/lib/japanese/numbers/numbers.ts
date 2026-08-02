
export const japaneseNumbers = {
    
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


const digitMap = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"]
const unitMap = ["", "十", "百", "千", "万"]


export function arabicToJapanese(num: number): string {
    if (num === 0) return "〇"
    if (num < 0) return ""

    let result = ""
    const s = num.toString()
    const len = s.length

    for (let i = 0; i < len; i++) {
        const char = s[i]
        if (!char) continue
        const n = parseInt(char)
        const pos = len - i - 1 

        
        

        if (n === 0) continue

        
        

        
        const unit = unitMap[pos] || ""

        if (pos === 4) { 
            
            result += (digitMap[n] || "") + "万"
            continue
        }

        if (n === 1 && pos > 0) {
            result += unit
        } else {
            result += (digitMap[n] || "") + unit
        }
    }
    return result
}

const valueMap: Record<string, number> = {
    "〇": 0, "零": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5,
    "六": 6, "七": 7, "八": 8, "九": 9, "十": 10, "百": 100,
    "千": 1000, "万": 10000
}


export function japaneseToArabic(japanese: string): number {
    if (japanese === "〇" || japanese === "零") return 0
    if (!japanese) return -1

    let total = 0
    let current = 0

    for (const char of japanese) {
        const val = valueMap[char]
        if (val === undefined) continue

        if (val < 10) {
            current = val
        } else {
            
            if (val === 10000) {
                total = (total + (current || 1)) * val
                current = 0
            } else {
                total += (current || 1) * val
                current = 0
            }
        }
    }
    return total + current
}


export function generateRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}



export type { NumberDifficulty } from "@/types/japanese"

export type Difficulty = import("@/types/japanese").NumberDifficulty

export const difficultyRanges: Record<Difficulty, { min: number; max: number; label: string }> = {
    easy: { min: 1, max: 10, label: "1-10" },
    medium: { min: 1, max: 99, label: "1-99" },
    hard: { min: 1, max: 999, label: "1-999" },
    expert: { min: 1, max: 99999, label: "1-99999" },
}
