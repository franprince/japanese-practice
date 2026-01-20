
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

import type { TranslationKey } from "./translations"


export const daysOfWeek: Record<number, { reading: string; romaji: string; kanji: string; labelKey: TranslationKey }> = {
  0: { reading: "にちようび", romaji: "nichiyoubi", kanji: "日曜日", labelKey: "day.sunday" },
  1: { reading: "げつようび", romaji: "getsuyoubi", kanji: "月曜日", labelKey: "day.monday" },
  2: { reading: "かようび", romaji: "kayoubi", kanji: "火曜日", labelKey: "day.tuesday" },
  3: { reading: "すいようび", romaji: "suiyoubi", kanji: "水曜日", labelKey: "day.wednesday" },
  4: { reading: "もくようび", romaji: "mokuyoubi", kanji: "木曜日", labelKey: "day.thursday" },
  5: { reading: "きんようび", romaji: "kinyoubi", kanji: "金曜日", labelKey: "day.friday" },
  6: { reading: "どようび", romaji: "doyoubi", kanji: "土曜日", labelKey: "day.saturday" },
}

// Import types from centralized location for use in this file
import type { DateMode, DateQuestion } from "@/types/japanese"

// Re-export types from centralized location
export type { DateMode, DateQuestion } from "@/types/japanese"

export function generateDayQuestion(): DateQuestion {
  const day = Math.floor(Math.random() * 31) + 1
  const dayData = daysOfMonth[day]
  if (!dayData) {
    throw new Error(`Invalid day generated: ${day}`)
  }
  return {
    display: `${day}`,
    displayName: `${day}`,
    displayNumber: `${day}`,
    answer: dayData.reading,
    romaji: dayData.romaji,
  }
}


export function generateMonthQuestion(t?: (key: TranslationKey) => string): DateQuestion {
  const month = Math.floor(Math.random() * 12) + 1
  const monthData = months[month]
  if (!monthData) {
    throw new Error(`Invalid month generated: ${month}`)
  }

  let display = `${month}`
  if (t) {
    const monthKeys: TranslationKey[] = [
      "month.january", "month.february", "month.march", "month.april",
      "month.may", "month.june", "month.july", "month.august",
      "month.september", "month.october", "month.november", "month.december"
    ]
    const monthIndex = month - 1
    if (monthKeys[monthIndex]) {
      display = t(monthKeys[monthIndex])
    }
  } else {

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"]
    const monthIndex = month - 1
    if (monthNames[monthIndex]) {
      display = monthNames[monthIndex]
    }
  }

  return {
    display,
    displayName: display,
    displayNumber: `${month}`,
    answer: monthData.reading,
    romaji: monthData.romaji,
    kanji: monthData.kanji,
  }
}


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
    displayName: `${month}/${day}`,
    displayNumber: `${month}/${day}`,
    answer: `${monthData.reading}${dayData.reading}`,
    romaji: `${monthData.romaji} ${dayData.romaji}`,
    kanji: `${monthData.kanji}${day}日`,
  }
}


export function generateWeekDayQuestion(t?: (key: TranslationKey) => string): DateQuestion {
  const dayIndex = Math.floor(Math.random() * 7)
  const dayData = daysOfWeek[dayIndex]

  if (!dayData) {
    throw new Error(`Invalid week day generated: ${dayIndex}`)
  }

  return {
    display: t ? t(dayData.labelKey) : dayData.romaji,
    displayName: t ? t(dayData.labelKey) : dayData.romaji,
    displayNumber: `${dayIndex + 1}`,
    answer: dayData.reading,
    romaji: dayData.romaji,
    kanji: dayData.kanji,
  }
}


export function generateWeekDaysQuestion(t?: (key: TranslationKey) => string): DateQuestion {
  return generateWeekDayQuestion(t)
}

export function generateDateQuestion(mode: DateMode, t?: (key: TranslationKey) => string, useNumbers: boolean = false): DateQuestion {
  switch (mode) {
    case "months":
      return generateMonthQuestion(t)
    case "full":
      return generateFullDateQuestion()
    case "week_days":
      return useNumbers ? generateDayQuestion() : generateWeekDaysQuestion(t)
  }
}
