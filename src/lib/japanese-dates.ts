// Japanese date data with readings and romaji
// Days of the month have special/irregular readings

export type DateDifficulty = "easy" | "medium" | "hard"

// Days of the month (1-31) with their readings
export const daysOfMonth: Record<number, { reading: string; romaji: string }> = {
  1: { reading: "ついたち", romaji: "tsuitachi" },
  2: { reading: "ふつか", romaji: "futsuka" },
  3: { reading: "みっか", romaji: "mikka" },
  4: { reading: "よっか", romaji: "yokka" },
  5: { reading: "いつか", romaji: "itsuka" },
  6: { reading: "むいか", romaji: "muika" },
  7: { reading: "なのか", romaji: "nanoka" },
  8: { reading: "ようか", romaji: "youka" },
  9: { reading: "ここのか", romaji: "kokonoka" },
  10: { reading: "とおか", romaji: "tooka" },
  11: { reading: "じゅういちにち", romaji: "juuichinichi" },
  12: { reading: "じゅうににち", romaji: "juuninichi" },
  13: { reading: "じゅうさんにち", romaji: "juusannichi" },
  14: { reading: "じゅうよっか", romaji: "juuyokka" },
  15: { reading: "じゅうごにち", romaji: "juugonichi" },
  16: { reading: "じゅうろくにち", romaji: "juurokunichi" },
  17: { reading: "じゅうしちにち", romaji: "juushichinichi" },
  18: { reading: "じゅうはちにち", romaji: "juuhachinichi" },
  19: { reading: "じゅうくにち", romaji: "juukunichi" },
  20: { reading: "はつか", romaji: "hatsuka" },
  21: { reading: "にじゅういちにち", romaji: "nijuuichinichi" },
  22: { reading: "にじゅうににち", romaji: "nijuuninichi" },
  23: { reading: "にじゅうさんにち", romaji: "nijuusannichi" },
  24: { reading: "にじゅうよっか", romaji: "nijuuyokka" },
  25: { reading: "にじゅうごにち", romaji: "nijuugonichi" },
  26: { reading: "にじゅうろくにち", romaji: "nijuurokunichi" },
  27: { reading: "にじゅうしちにち", romaji: "nijuushichinichi" },
  28: { reading: "にじゅうはちにち", romaji: "nijuuhachinichi" },
  29: { reading: "にじゅうくにち", romaji: "nijuukunichi" },
  30: { reading: "さんじゅうにち", romaji: "sanjuunichi" },
  31: { reading: "さんじゅういちにち", romaji: "sanjuuichinichi" },
}

// Months (1-12) with their readings
export const months: Record<number, { reading: string; romaji: string; kanji: string }> = {
  1: { reading: "いちがつ", romaji: "ichigatsu", kanji: "一月" },
  2: { reading: "にがつ", romaji: "nigatsu", kanji: "二月" },
  3: { reading: "さんがつ", romaji: "sangatsu", kanji: "三月" },
  4: { reading: "しがつ", romaji: "shigatsu", kanji: "四月" },
  5: { reading: "ごがつ", romaji: "gogatsu", kanji: "五月" },
  6: { reading: "ろくがつ", romaji: "rokugatsu", kanji: "六月" },
  7: { reading: "しちがつ", romaji: "shichigatsu", kanji: "七月" },
  8: { reading: "はちがつ", romaji: "hachigatsu", kanji: "八月" },
  9: { reading: "くがつ", romaji: "kugatsu", kanji: "九月" },
  10: { reading: "じゅうがつ", romaji: "juugatsu", kanji: "十月" },
  11: { reading: "じゅういちがつ", romaji: "juuichigatsu", kanji: "十一月" },
  12: { reading: "じゅうにがつ", romaji: "juunigatsu", kanji: "十二月" },
}

export type DateMode = "days" | "months" | "full"

export interface DateQuestion {
  display: string // What to show (e.g., "March 15" or "15")
  answer: string // Expected hiragana answer
  romaji: string // Romaji version for hints
  kanji?: string // Kanji version if applicable
}

// Generate a random day question
export function generateDayQuestion(): DateQuestion {
  const day = Math.floor(Math.random() * 31) + 1
  const dayData = daysOfMonth[day]
  if (!dayData) {
    throw new Error(`Invalid day generated: ${day}`)
  }
  return {
    display: `${day}`,
    answer: dayData.reading,
    romaji: dayData.romaji,
  }
}

// Generate a random month question
export function generateMonthQuestion(): DateQuestion {
  const month = Math.floor(Math.random() * 12) + 1
  const monthData = months[month]
  if (!monthData) {
    throw new Error(`Invalid month generated: ${month}`)
  }
  return {
    display: `${month}`,
    answer: monthData.reading,
    romaji: monthData.romaji,
    kanji: monthData.kanji,
  }
}

// Generate a full date question (month + day)
export function generateFullDateQuestion(): DateQuestion {
  const month = Math.floor(Math.random() * 12) + 1
  const day = Math.floor(Math.random() * 31) + 1
  const monthData = months[month]
  const dayData = daysOfMonth[day]
  if (!monthData || !dayData) {
    throw new Error(`Invalid date generated: ${month}/${day}`)
  }

  return {
    display: `${month}/${day}`,
    answer: `${monthData.reading}${dayData.reading}`,
    romaji: `${monthData.romaji} ${dayData.romaji}`,
    kanji: `${monthData.kanji}${day}日`,
  }
}

export function generateDateQuestion(mode: DateMode): DateQuestion {
  switch (mode) {
    case "days":
      return generateDayQuestion()
    case "months":
      return generateMonthQuestion()
    case "full":
      return generateFullDateQuestion()
  }
}
