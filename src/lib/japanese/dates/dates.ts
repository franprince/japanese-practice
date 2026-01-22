
const irregularDays: Record<number, { reading: string, romaji: string }> = {
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
  14: { reading: "じゅうよっか", romaji: "juuyokka" },
  20: { reading: "はつか", romaji: "hatsuka" },
  24: { reading: "にじゅうよっか", romaji: "nijuuyokka" },
}

function getDayData(day: number) {
  if (irregularDays[day]) return irregularDays[day]

  const numReadings = ["", "いち", "に", "さん", "よん", "ご", "ろく", "しち", "はち", "きゅう", "じゅう"]
  const romajiNums = ["", "ichi", "ni", "san", "yon", "go", "roku", "shichi", "hachi", "kyuu", "juu"]

  let reading = ""
  let romaji = ""

  if (day >= 10) {
    if (day === 10) { // covered by irregular but logic works
      reading = "じゅう"
      romaji = "juu"
    } else if (day < 20) {
      reading = "じゅう" + numReadings[day - 10]
      romaji = "juu" + romajiNums[day - 10]
    } else {
      const tens = Math.floor(day / 10)
      const ones = day % 10
      reading = (tens === 2 ? "にじゅう" : "さんじゅう") + (ones > 0 ? numReadings[ones] : "")
      romaji = (tens === 2 ? "nijuu" : "sanjuu") + (ones > 0 ? romajiNums[ones] : "")
    }
  } else {
    reading = numReadings[day] || ""
    romaji = romajiNums[day] || ""
  }

  return { reading: reading + "にち", romaji: romaji + "nichi" }
}

export const daysOfMonth: Record<number, { reading: string; romaji: string }> = new Proxy({}, {
  get: (_, prop) => {
    const day = typeof prop === 'string' ? parseInt(prop, 10) : Number(prop)
    if (isNaN(day) || day < 1 || day > 31) return undefined
    return getDayData(day)
  }
})

const irregularMonths: Record<number, { reading: string, romaji: string }> = {
  4: { reading: "しがつ", romaji: "shigatsu" },
  7: { reading: "しちがつ", romaji: "shichigatsu" },
  9: { reading: "くがつ", romaji: "kugatsu" },
}

function getMonthData(month: number) {
  if (irregularMonths[month]) return { ...irregularMonths[month], kanji: ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"][month] + "月" }

  const numReadings = ["", "いち", "に", "さん", "よん", "ご", "ろく", "しち", "はち", "きゅう", "じゅう", "じゅういち", "じゅうに"]
  const romajiNums = ["", "ichi", "ni", "san", "yon", "go", "roku", "shichi", "hachi", "kyuu", "juu", "juuichi", "juuni"]
  const kanjiNums = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"]

  return {
    reading: numReadings[month] + "がつ",
    romaji: romajiNums[month] + "gatsu",
    kanji: kanjiNums[month] + "月"
  }
}

export const months: Record<number, { reading: string; romaji: string; kanji: string }> = new Proxy({}, {
  get: (_, prop) => {
    const month = typeof prop === 'string' ? parseInt(prop, 10) : Number(prop)
    if (isNaN(month) || month < 1 || month > 12) return undefined
    return getMonthData(month)
  }
})

import type { TranslationKey } from "@/lib/i18n/translations"

export const daysOfWeek: Record<number, { reading: string; romaji: string; kanji: string; labelKey: TranslationKey }> = {
  0: { reading: "にちようび", romaji: "nichiyoubi", kanji: "日曜日", labelKey: "day.sunday" },
  1: { reading: "げつようび", romaji: "getsuyoubi", kanji: "月曜日", labelKey: "day.monday" },
  2: { reading: "かようび", romaji: "kayoubi", kanji: "火曜日", labelKey: "day.tuesday" },
  3: { reading: "すいようび", romaji: "suiyoubi", kanji: "水曜日", labelKey: "day.wednesday" },
  4: { reading: "もくようび", romaji: "mokuyoubi", kanji: "木曜日", labelKey: "day.thursday" },
  5: { reading: "きんようび", romaji: "kinyoubi", kanji: "金曜日", labelKey: "day.friday" },
  6: { reading: "どようび", romaji: "doyoubi", kanji: "土曜日", labelKey: "day.saturday" },
}

export type DateMode = "months" | "full" | "week_days"

export interface DateQuestion {
  display: string
  displayName: string
  displayNumber: string
  answer: string
  romaji: string
  kanji?: string
}


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
