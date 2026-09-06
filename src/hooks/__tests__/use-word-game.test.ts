import { StrictMode } from "react"
import { describe, expect, it, mock, spyOn, beforeEach, afterEach } from "bun:test"
import { renderHook, act, waitFor } from "@testing-library/react"
import type { JapaneseWord, ErrorDetectionResult } from "@/types/japanese"
import * as detection from "@/lib/japanese/shared"
import { useSessionProgress } from "../use-session-progress"

type Resolver = (word: JapaneseWord) => void
let resolvers: Resolver[] = []

import * as words from "@/lib/japanese/words"
import { useWordGame } from "../use-word-game"

let restoreSelectors: () => void
beforeEach(() => {
    const pending = () => new Promise<JapaneseWord>(resolve => { resolvers.push(resolve) })
    const vocabulary = spyOn(words, "getRandomWord").mockImplementation(pending)
    const characters = spyOn(words, "getRandomCharacter").mockImplementation(pending)
    restoreSelectors = () => { vocabulary.mockRestore(); characters.mockRestore() }
})
afterEach(() => restoreSelectors())

const filter = { selectedGroups: [], minLength: 1, maxLength: 6 }
const word = (romaji: string): JapaneseWord => ({ kana: "あ", romaji, type: "hiragana", groups: [] })
const incorrect: ErrorDetectionResult = {
    characters: [{ kana: "あ", expectedRomaji: ["a"], userInput: "wrong", isCorrect: false }],
    isFullyCorrect: false,
    correctCount: 0,
    incorrectCount: 1,
    extraInput: "",
}

function renderWordSession(target = 10) {
    resolvers = []
    return renderHook(() => {
        const session = useSessionProgress({ basePoints: 1, defaultTargetCount: target })
        const game = useWordGame({
            mode: "hiragana", filter, gameType: "words",
            disableNext: session.sessionComplete, suppressFocus: true, lang: "es",
            sessionId: session.sessionId, onSessionEvent: session.handleSessionEvent,
        })
        return { session, game }
    })
}

async function resolveWord(index = resolvers.length - 1, value = "a") {
    await act(async () => { resolvers[index]!(word(value)) })
}

describe("Words session integration", () => {
    it("admits a synchronous correct answer before an immediate Skip", async () => {
        const { result } = renderWordSession()
        await resolveWord()
        act(() => {
            result.current.game.checkAnswer("a")
            result.current.game.skipWord()
        })
        expect(result.current.session).toMatchObject({ answeredCount: 1, correctCount: 1, submittedCount: 1, score: 1 })
        expect(result.current.game.feedback).toBe("correct")
    })
    it("keeps the most recent question when loads resolve out of order", async () => {
        const { result } = renderWordSession()
        expect(resolvers).toHaveLength(1)
        act(() => { void result.current.game.loadNewWord() })
        expect(resolvers).toHaveLength(2)
        await resolveWord(1, "second")
        await resolveWord(0, "first")
        expect(result.current.game.currentWord?.romaji).toBe("second")
    })

    it("scores one point once for duplicate submissions and locks at the target", async () => {
        const { result } = renderWordSession(1)
        await resolveWord()
        await act(async () => {
            result.current.game.checkAnswer("a")
            result.current.game.checkAnswer("a")
        })
        expect(result.current.session.score).toBe(1)
        expect(result.current.session.answeredCount).toBe(1)
        expect(result.current.session.sessionComplete).toBe(true)
        expect(result.current.game.feedback).toBe("correct")
        await act(async () => {
            result.current.game.skipWord()
            result.current.game.checkAnswer("a")
            await result.current.game.loadNewWord()
        })
        expect(result.current.session.answeredCount).toBe(1)
        expect(resolvers).toHaveLength(1)
        act(() => { result.current.session.resetSession() })
        await resolveWord()
        expect(result.current.session.score).toBe(0)
        expect(result.current.game.feedback).toBeNull()
        expect(result.current.game.userInput).toBe("")
    })

    it("retains the final word on a language change and loads the new language after restart", async () => {
        resolvers = []
        const { result, rerender } = renderHook(
            ({ lang }: { lang: "en" | "es" }) => {
                const session = useSessionProgress({ basePoints: 1, defaultTargetCount: 1 })
                const game = useWordGame({
                    mode: "hiragana", filter, gameType: "words",
                    disableNext: session.sessionComplete, suppressFocus: true, lang,
                    sessionId: session.sessionId, onSessionEvent: session.handleSessionEvent,
                })
                return { session, game }
            },
            { initialProps: { lang: "es" } },
        )
        await resolveWord()
        const finalWord = result.current.game.currentWord
        await act(async () => { result.current.game.checkAnswer("a") })
        expect(result.current.session.sessionComplete).toBe(true)

        rerender({ lang: "en" })
        expect(resolvers).toHaveLength(1)
        expect(result.current.game.currentWord).toBe(finalWord)
        expect(result.current.game).toMatchObject({ feedback: "correct", isLoading: false })
        expect(result.current.session).toMatchObject({ answeredCount: 1, score: 1, sessionComplete: true })

        act(() => result.current.session.resetSession())
        expect(resolvers).toHaveLength(2)
        expect(words.getRandomWord).toHaveBeenLastCalledWith("hiragana", filter, "en")
        await resolveWord(1, "new-language")
        expect(result.current.game.currentWord?.romaji).toBe("new-language")
        expect(result.current.game).toMatchObject({ feedback: null, userInput: "", isLoading: false })
        expect(result.current.session).toMatchObject({ answeredCount: 0, score: 0, sessionComplete: false })
    })

    it("keeps submission accuracy separate from skips using session counts", async () => {
        const { result } = renderWordSession()
        await resolveWord()
        await act(async () => { result.current.game.checkAnswer("a") })
        act(() => { void result.current.game.loadNewWord() })
        await resolveWord()
        act(() => {
            result.current.game.skipWord()
            result.current.game.skipWord()
        })
        expect(result.current.session.answeredCount).toBe(2)
        expect(result.current.session.correctCount).toBe(1)
        expect(result.current.session.submittedCount).toBe(1)
        expect(result.current.session.answerAccuracy).toBe(100)
        expect(result.current.session.accuracy).toBe(50)
        expect(result.current.session.streak).toBe(0)
        expect(result.current.game.feedback).toBe("incorrect")
    })

    for (const invalidate of ["skip", "next", "restart", "unmount"] as const) {
        it(`discards delayed validation after ${invalidate}`, async () => {
            let resolveDetection!: (value: ErrorDetectionResult) => void
            const validate = spyOn(detection, "detectErrors").mockImplementation(() => new Promise(resolve => { resolveDetection = resolve }))
            try {
                const { result, unmount } = renderWordSession()
                await resolveWord()
                act(() => {
                    result.current.game.checkAnswer("wrong")
                    result.current.game.checkAnswer("wrong")
                })
                expect(validate).toHaveBeenCalledTimes(1)
                act(() => {
                    if (invalidate === "skip") result.current.game.skipWord()
                    if (invalidate === "next") void result.current.game.loadNewWord()
                    if (invalidate === "restart") result.current.session.resetSession()
                    if (invalidate === "unmount") unmount()
                })
                await act(async () => { resolveDetection(incorrect) })
                if (invalidate === "unmount") return
                if (invalidate === "next" || invalidate === "restart") await resolveWord()
                expect(result.current.session.answeredCount).toBe(invalidate === "skip" ? 1 : 0)
                expect(result.current.game.incorrectChars.size).toBe(0)
                expect(result.current.game.errorDetails).toBeNull()
                expect(result.current.game.feedback).toBe(invalidate === "skip" ? "incorrect" : null)
            } finally {
                validate.mockRestore()
            }
        })
    }

    it("clears accumulated character diagnostics on restart without remounting", async () => {
        const validate = spyOn(detection, "detectErrors").mockResolvedValue(incorrect)
        try {
            const { result } = renderWordSession()
            await resolveWord()
            await act(async () => { result.current.game.checkAnswer("wrong") })
            expect(result.current.game.incorrectChars.get("あ")?.count).toBe(1)
            act(() => { result.current.session.resetSession("infinite", 5) })
            await resolveWord()
            expect(result.current.session.sessionId).toBe(1)
            expect(result.current.session.playMode).toBe("infinite")
            expect(result.current.session.targetCount).toBe(5)
            expect(result.current.game.incorrectChars.size).toBe(0)
            expect(result.current.game.errorDetails).toBeNull()
        } finally {
            validate.mockRestore()
        }
    })
})


describe("Words lifecycle stability", () => {
    it("does not load on focus, equivalent filter or callback-only changes", async () => {
        resolvers = []
        const { result, rerender } = renderHook(({ suppressFocus, groups }) => useWordGame({
            mode: "hiragana", filter: { ...filter, selectedGroups: groups }, gameType: "words",
            disableNext: false, suppressFocus, lang: "en", sessionId: 0, onSessionEvent: mock(),
        }), { initialProps: { suppressFocus: true, groups: ["a", "b"] } })
        await resolveWord()
        act(() => result.current.setUserInput("partial"))
        const currentWord = result.current.currentWord
        rerender({ suppressFocus: false, groups: ["b", "a"] })
        expect(resolvers).toHaveLength(1)
        expect(result.current.currentWord).toBe(currentWord)
        expect(result.current.userInput).toBe("partial")
    })
    it("commits only the current request after Strict Mode effect replay", async () => {
        resolvers = []
        const outcomes = mock()
        const { result, unmount } = renderHook(() => useWordGame({
            mode: "hiragana", filter, gameType: "words", disableNext: false,
            suppressFocus: true, lang: "en", sessionId: 0, onSessionEvent: outcomes,
        }), { wrapper: StrictMode })
        expect(resolvers).toHaveLength(2)
        await resolveWord(1, "current")
        await resolveWord(0, "obsolete")
        expect(result.current.currentWord?.romaji).toBe("current")
        expect(outcomes).not.toHaveBeenCalled()
        const before = result.current.currentWord
        act(() => { void result.current.loadNewWord() })
        unmount()
        await resolveWord(2, "unmounted")
        expect(result.current.currentWord).toBe(before)
    })
})


describe("Guess selection characterization", () => {
    it("requests one character and falls back after ten repeated distractors", async () => {
        const selected = spyOn(words, "getRandomCharacter").mockResolvedValue(word("a"))
        let step = 0
        const random = spyOn(Math, "random").mockImplementation(() => [0.1, 0.2, 0.3][step++ % 3]!)
        try {
            const { result } = renderHook(() => useWordGame({
                mode: "both", filter: { ...filter, minLength: 3, maxLength: 6 }, gameType: "guess",
                disableNext: false, suppressFocus: true, lang: "en", sessionId: 0, onSessionEvent: mock(),
            }))
            await waitFor(() => expect(result.current.options).toHaveLength(3))
            expect(selected).toHaveBeenCalledTimes(11)
            expect(selected).toHaveBeenLastCalledWith("both", { ...filter, minLength: 1, maxLength: 1 })
            expect(new Set(result.current.options).size).toBe(3)
            expect(result.current.options).toContain("a")
        } finally { selected.mockRestore(); random.mockRestore() }
    })
})
