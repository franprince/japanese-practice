import { describe, expect, it } from "bun:test"
import {
  beginnerSettings,
  isPracticeSettings,
  practiceDefaults,
  type PracticeKind,
} from "../practice-preferences"

const kinds: PracticeKind[] = ["words", "numbers", "dates", "kanji"]

describe("isPracticeSettings", () => {
  it("accepts every default setting", () => {
    for (const kind of kinds) expect(isPracticeSettings(kind, practiceDefaults[kind])).toBe(true)
  })

  it("accepts valid beginner settings", () => {
    expect(isPracticeSettings("words", beginnerSettings)).toBe(true)
  })

  it.each([
    ["unknown version", "numbers", { ...practiceDefaults.numbers, version: 2 }],
    ["invalid number mode", "numbers", { ...practiceDefaults.numbers, mode: "decimal" }],
    ["invalid date mode", "dates", { ...practiceDefaults.dates, mode: "years" }],
    ["invalid kanji difficulty", "kanji", { ...practiceDefaults.kanji, difficulty: "n0" }],
    ["invalid words mode", "words", { ...practiceDefaults.words, mode: "all" }],
    ["invalid words game type", "words", { ...practiceDefaults.words, gameType: "spelling" }],
    ["noninteger target", "numbers", { ...practiceDefaults.numbers, targetCount: 2.5 }],
    ["target below range", "numbers", { ...practiceDefaults.numbers, targetCount: 0 }],
    ["target above range", "numbers", { ...practiceDefaults.numbers, targetCount: 51 }],
    ["malformed groups", "words", { ...beginnerSettings, mode: "custom", filter: { selectedGroups: [1], minLength: 1, maxLength: 2 } }],
    ["reversed lengths", "words", { ...beginnerSettings, filter: { selectedGroups: ["basic"], minLength: 4, maxLength: 2 } }],
    ["empty custom groups", "words", { ...beginnerSettings, mode: "custom", filter: { selectedGroups: [], minLength: 1, maxLength: 2 } }],
  ])("rejects %s", (_label, kind, value) => {
    expect(isPracticeSettings(kind as PracticeKind, value)).toBe(false)
  })
})

it("rejects arrays masquerading as saved string selections", () => {
    expect(isPracticeSettings("words", { ...practiceDefaults.words, mode: ["hiragana"] })).toBe(false)
    expect(isPracticeSettings("numbers", { ...practiceDefaults.numbers, difficulty: ["easy"] })).toBe(false)
    expect(isPracticeSettings("dates", { ...practiceDefaults.dates, playMode: ["session"] })).toBe(false)
})
