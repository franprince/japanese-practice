import { describe, expect, it, spyOn } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useNumberGame } from "../use-number-game"
import { useDateGame } from "../use-date-game"
import { useKanjiGame } from "../use-kanji-game"
import { useSessionProgress } from "../use-session-progress"
import type { KanjiEntry } from "@/types/japanese"

const t = (key: string) => key

function useNumbers(mode: "arabicToKanji" | "kanjiToArabic" = "kanjiToArabic", target = 2) {
    const session = useSessionProgress({ defaultTargetCount: target })
    const game = useNumberGame({
        difficulty: "easy", mode,
        sessionId: session.sessionId, onSessionEvent: session.handleSessionEvent,
        disableNext: session.sessionComplete,
    })
    return { session, game }
}

function useDates(target = 2, translate = t) {
    const session = useSessionProgress({ defaultTargetCount: target })
    const game = useDateGame({
        mode: "months", t: translate,
        sessionId: session.sessionId, onSessionEvent: session.handleSessionEvent,
        disableNext: session.sessionComplete,
    })
    return { session, game }
}

describe("game hooks with reducer-backed sessions", () => {
    it("Numbers submits once, bounds final skips, locks completion and restarts without remounting", () => {
        const { result } = renderHook(() => useNumbers())
        act(() => result.current.game.handleKeyPress(String(result.current.game.currentNumber)))
        act(() => {
            result.current.game.handleSubmit()
            result.current.game.handleSubmit()
        })
        expect(result.current.session).toMatchObject({ score: 10, streak: 1, correctCount: 1, answeredCount: 1 })
        expect(result.current.game).toMatchObject({ showResult: true, isCorrect: true })

        act(() => result.current.game.handleNext())
        expect(result.current.game.userAnswer).toBe("")
        act(() => {
            result.current.game.handleSkip()
            result.current.game.handleSkip()
        })
        expect(result.current.session).toMatchObject({ score: 10, streak: 0, answeredCount: 2, skippedCount: 1, remainingQuestions: 0, sessionComplete: true })
        const completedNumber = result.current.game.currentNumber
        act(() => {
            result.current.game.handleKeyPress("1")
            result.current.game.handleSubmit()
            result.current.game.handleNext()
            result.current.game.handleSkip()
        })
        expect(result.current.game.currentNumber).toBe(completedNumber)
        expect(result.current.game.userAnswer).toBe("")
        expect(result.current.session.answeredCount).toBe(2)

        const previousSessionId = result.current.session.sessionId
        act(() => result.current.session.resetSession())
        expect(result.current.session).toMatchObject({ score: 0, streak: 0, answeredCount: 0, sessionComplete: false, sessionId: previousSessionId + 1 })
        expect(result.current.game).toMatchObject({ userAnswer: "", showResult: false })
        act(() => result.current.game.handleKeyPress(String(result.current.game.currentNumber)))
        act(() => result.current.game.handleSubmit())
        expect(result.current.session).toMatchObject({ score: 10, answeredCount: 1, correctCount: 1 })
    })

    it("Numbers direction changes preserve the session, current number and partially typed input", () => {
        const { result, rerender } = renderHook(
            ({ mode }: { mode: "arabicToKanji" | "kanjiToArabic" }) => useNumbers(mode, 10),
            { initialProps: { mode: "kanjiToArabic" } },
        )
        act(() => result.current.game.handleKeyPress(String(result.current.game.currentNumber)))
        act(() => result.current.game.handleSubmit())
        act(() => result.current.game.handleNext())
        act(() => result.current.game.handleKeyPress("1"))
        const number = result.current.game.currentNumber
        const sessionId = result.current.session.sessionId
        rerender({ mode: "arabicToKanji" })
        expect(result.current.game).toMatchObject({ currentNumber: number, userAnswer: "1", showResult: false, shuffleNumbers: true })
        expect(result.current.session).toMatchObject({ sessionId, score: 10, answeredCount: 1 })
    })

    it("Dates preserves display-toggle input, emits one answer, bounds skips and resets display state", () => {
        const { result } = renderHook(() => useDates())
        const question = result.current.game.question!
        act(() => result.current.game.setUserInput(question.romaji))
        act(() => result.current.game.setShowNumbers(true))
        expect(result.current.game.question).toBe(question)
        expect(result.current.game.userInput).toBe(question.romaji)
        act(() => {
            result.current.game.handleSubmit()
            result.current.game.handleSubmit()
        })
        expect(result.current.session).toMatchObject({ score: 10, answeredCount: 1, correctCount: 1, streak: 1 })
        expect(result.current.game).toMatchObject({ showResult: true, isCorrect: true })
        act(() => result.current.game.generateNewQuestion())
        act(() => {
            result.current.game.handleSkip()
            result.current.game.handleSkip()
        })
        expect(result.current.session).toMatchObject({ answeredCount: 2, skippedCount: 1, streak: 0, score: 10, sessionComplete: true, remainingQuestions: 0 })
        const completedQuestion = result.current.game.question
        act(() => {
            result.current.game.handleSubmit()
            result.current.game.generateNewQuestion()
            result.current.game.handleSkip()
        })
        expect(result.current.game.question).toBe(completedQuestion)
        expect(result.current.game.userInput).toBe("")
        expect(result.current.session.answeredCount).toBe(2)

        act(() => result.current.session.resetSession())
        expect(result.current.game).toMatchObject({ userInput: "", showNumbers: false, showResult: false })
        expect(result.current.session).toMatchObject({ score: 0, answeredCount: 0, sessionComplete: false })
        act(() => result.current.game.setUserInput(result.current.game.question!.answer))
        act(() => result.current.game.handleSubmit())
        expect(result.current.session).toMatchObject({ score: 10, answeredCount: 1, correctCount: 1 })
    })

    it("Dates retains the final answer on a language change and uses the new language after restart", () => {
        const { result, rerender } = renderHook(
            ({ translate }) => useDates(1, translate),
            { initialProps: { translate: t } },
        )
        const finalQuestion = result.current.game.question!
        act(() => result.current.game.setUserInput(finalQuestion.answer))
        act(() => result.current.game.handleSubmit())
        expect(result.current.session.sessionComplete).toBe(true)
        expect(result.current.game).toMatchObject({ showResult: true, isCorrect: true })

        rerender({ translate: (key: string) => `translated:${key}` })
        expect(result.current.game.question).toBe(finalQuestion)
        expect(result.current.game).toMatchObject({ userInput: finalQuestion.answer, showResult: true, isCorrect: true })
        expect(result.current.session).toMatchObject({ answeredCount: 1, score: 10, sessionComplete: true })

        act(() => result.current.session.resetSession())
        expect(result.current.game.question).not.toBe(finalQuestion)
        expect(result.current.game.question!.display).toContain("translated:")
        expect(result.current.game).toMatchObject({ userInput: "", showResult: false })
        expect(result.current.session).toMatchObject({ answeredCount: 0, score: 0, sessionComplete: false })
    })

    it("does not consume the unrendered next Number or Date when Skip is clicked twice", () => {
        const numbers = renderHook(() => useNumbers("kanjiToArabic", 10))
        act(() => {
            numbers.result.current.game.handleSkip()
            numbers.result.current.game.handleSkip()
        })
        expect(numbers.result.current.session).toMatchObject({ answeredCount: 1, skippedCount: 1, remainingQuestions: 9 })
        act(() => numbers.result.current.game.handleSkip())
        expect(numbers.result.current.session.answeredCount).toBe(2)
        numbers.unmount()

        const dates = renderHook(() => useDates(10))
        act(() => {
            dates.result.current.game.handleSkip()
            dates.result.current.game.handleSkip()
        })
        expect(dates.result.current.session).toMatchObject({ answeredCount: 1, skippedCount: 1, remainingQuestions: 9 })
        act(() => dates.result.current.game.handleSkip())
        expect(dates.result.current.session.answeredCount).toBe(2)
    })

    it("rejects stale handlers retained across a Number session restart", () => {
        const { result } = renderHook(() => useNumbers())
        act(() => result.current.game.handleKeyPress(String(result.current.game.currentNumber)))
        const staleSubmit = result.current.game.handleSubmit
        const staleSkip = result.current.game.handleSkip
        act(() => result.current.session.resetSession())
        act(() => {
            staleSubmit()
            staleSkip()
        })
        expect(result.current.session).toMatchObject({ answeredCount: 0, score: 0, skippedCount: 0 })
        expect(result.current.game).toMatchObject({ userAnswer: "", showResult: false })
        act(() => result.current.game.handleKeyPress(String(result.current.game.currentNumber)))
        act(() => result.current.game.handleSubmit())
        expect(result.current.session).toMatchObject({ answeredCount: 1, correctCount: 1, score: 10 })
    })

    it("incorrect Number and Date answers consume a round without awarding points", () => {
        const numbers = renderHook(() => useNumbers())
        act(() => numbers.result.current.game.handleKeyPress("999"))
        act(() => numbers.result.current.game.handleSubmit())
        expect(numbers.result.current.session).toMatchObject({ score: 0, streak: 0, answeredCount: 1, correctCount: 0, skippedCount: 0 })
        expect(numbers.result.current.game).toMatchObject({ showResult: true, isCorrect: false })
        numbers.unmount()

        const dates = renderHook(() => useDates())
        act(() => dates.result.current.game.setUserInput("incorrect"))
        act(() => dates.result.current.game.handleSubmit())
        expect(dates.result.current.session).toMatchObject({ score: 0, streak: 0, answeredCount: 1, correctCount: 0, skippedCount: 0 })
        expect(dates.result.current.game).toMatchObject({ showResult: true, isCorrect: false })
    })

    it("Kanji loads playable entries, admits one option per question and restarts after completion", async () => {
        const entries: KanjiEntry[] = [
            { char: "一", reading: "いち" },
            { char: "二", reading: "に" },
            { char: "三", reading: "さん" },
            { char: "四", reading: "" },
        ]
        const fetchFixture = Object.assign(async () => new Response(JSON.stringify(entries)), {
            preconnect: globalThis.fetch.preconnect,
        })
        const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(fetchFixture)
        try {
            const { result, unmount } = renderHook(() => {
                const session = useSessionProgress({ defaultTargetCount: 2 })
                const game = useKanjiGame({
                    difficulty: "easy",
                    sessionId: session.sessionId, onSessionEvent: session.handleSessionEvent,
                    disableNext: session.sessionComplete,
                })
                return { session, game }
            })
            await waitFor(() => expect(result.current.game.currentKanji).not.toBeNull())
            expect(fetchSpy).toHaveBeenCalledWith("/kanji-n5.json")
            expect(result.current.game.options).toHaveLength(3)
            expect(result.current.game.options.every(option => Boolean(option.reading))).toBe(true)
            const correct = result.current.game.currentKanji!
            const wrong = result.current.game.options.find(option => option.char !== correct.char)!
            act(() => {
                result.current.game.handleOptionClick(correct)
                result.current.game.handleOptionClick(wrong)
            })
            expect(result.current.session).toMatchObject({ score: 10, answeredCount: 1, correctCount: 1, streak: 1 })
            expect(result.current.game).toMatchObject({ selectedOption: correct, isRevealed: true, isCorrect: true })
            act(() => result.current.game.handleNext())
            expect(result.current.game.currentKanji).not.toBe(correct)
            const incorrect = result.current.game.options.find(option => option.char !== result.current.game.currentKanji!.char)!
            act(() => result.current.game.handleOptionClick(incorrect))
            expect(result.current.session).toMatchObject({ score: 10, answeredCount: 2, correctCount: 1, streak: 0, sessionComplete: true })
            const completedKanji = result.current.game.currentKanji
            act(() => {
                result.current.game.handleNext()
                result.current.game.handleOptionClick(completedKanji!)
            })
            expect(result.current.game.currentKanji).toBe(completedKanji)
            expect(result.current.game.selectedOption).toBe(incorrect)
            expect(result.current.session.answeredCount).toBe(2)

            act(() => result.current.session.resetSession())
            expect(result.current.game).toMatchObject({ selectedOption: null, isRevealed: false })
            expect(result.current.session).toMatchObject({ score: 0, answeredCount: 0, sessionComplete: false })
            act(() => result.current.game.handleOptionClick(result.current.game.currentKanji!))
            expect(result.current.session).toMatchObject({ score: 10, answeredCount: 1, correctCount: 1 })
            unmount()
        } finally {
            fetchSpy.mockRestore()
        }
    })

    it("derives Words answer accuracy without skips and session accuracy with skips", () => {
        const { result } = renderHook(() => useSessionProgress({ basePoints: 1, defaultTargetCount: 3 }))
        expect(result.current).toMatchObject({ accuracy: 0, answerAccuracy: 100, submittedCount: 0, remainingQuestions: 3 })
        act(() => {
            const sessionId = result.current.sessionId
            result.current.handleSessionEvent({ type: "answer-submitted", sessionId, questionId: 1, correct: true })
            result.current.handleSessionEvent({ type: "answer-submitted", sessionId, questionId: 2, correct: false })
            result.current.handleSessionEvent({ type: "question-skipped", sessionId, questionId: 3 })
        })
        expect(result.current).toMatchObject({ score: 1, accuracy: 33, answerAccuracy: 50, submittedCount: 2, answeredCount: 3, skippedCount: 1, remainingQuestions: 0, sessionComplete: true })
        expect(result.current.sessionSummaryProps).toMatchObject({ targetCount: 3, correctCount: 1, accuracy: 33 })
        const previousSessionId = result.current.sessionId
        act(() => result.current.resetSession("infinite", 5))
        expect(result.current).toMatchObject({ sessionId: previousSessionId + 1, playMode: "infinite", targetCount: 5, score: 0, answeredCount: 0, accuracy: 0, answerAccuracy: 100, remainingQuestions: undefined, sessionComplete: false })
        act(() => result.current.handleSessionEvent({ type: "answer-submitted", sessionId: previousSessionId, questionId: 4, correct: true }))
        expect(result.current.answeredCount).toBe(0)
    })
})
