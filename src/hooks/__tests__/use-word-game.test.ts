import { describe, expect, it, mock, spyOn } from "bun:test"
import { renderHook, act } from "@testing-library/react"
import type { JapaneseWord, ErrorDetectionResult } from "@/types/japanese"
import * as detection from "@/lib/japanese/shared/error-detection"
import { useSessionProgress } from "../use-session-progress"

type Resolver = (word: JapaneseWord) => void
let resolvers: Resolver[] = []

mock.module("@/lib/japanese/words", () => ({
    getRandomWord: mock(() => new Promise<JapaneseWord>((resolve) => { resolvers.push(resolve) })),
    getRandomCharacter: mock(() => new Promise<JapaneseWord>((resolve) => { resolvers.push(resolve) })),
}))

mock.module("@/lib/japanese/words/loader", () => ({
    confirmWordset: mock(),
    normalizeLang: mock((lang: string) => lang),
}))

const { useWordGame } = await import("../use-word-game")
const { getRandomWord } = await import("@/lib/japanese/words")
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
        expect(getRandomWord).toHaveBeenLastCalledWith("hiragana", filter, "en")
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
