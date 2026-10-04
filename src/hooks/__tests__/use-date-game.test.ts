import { describe, expect, it, mock } from "bun:test"
import { renderHook, act } from "@testing-library/react"
import { useDateGame } from "../use-date-game"
import { useSessionProgress } from "../use-session-progress"
import { generateFullDateQuestion, type DateQuestion } from "@/lib/japanese/dates"

const t = (key: string) => key

describe("useDateGame", () => {
    it.each([
        "ichigatsu tsuitachi",
        "ICHIGATSU\tTSUITACHI",
        "\n ichigatsu   tsuitachi \u3000",
        "ichigatsutsuitachi",
        "いちがつ\u3000ついたち",
    ])("accepts full-date answers with consistent whitespace normalization: %s", input => {
        const questions = [generateFullDateQuestion(() => 0)]
        const { result } = renderHook(() => {
            const session = useSessionProgress<DateQuestion>()
            const game = useDateGame({
                mode: "full", t, sessionId: session.sessionId,
                onSessionEvent: session.handleSessionEvent,
                onQuestionMissed: session.onQuestionMissed, reviewQuestions: questions,
            })
            return { session, game }
        })
        expect(result.current.game.question!.romaji).toBe("ichigatsu tsuitachi")
        act(() => result.current.game.setUserInput(input))
        act(() => result.current.game.handleSubmit())
        expect(result.current.game).toMatchObject({ userInput: input, showResult: true, isCorrect: true })
        expect(result.current.session).toMatchObject({ score: 10, answeredCount: 1, correctCount: 1 })
        expect(result.current.session.sessionSummaryProps.missedCount).toBe(0)
    })

    it("continues rejecting a different date after normalizing whitespace", () => {
        const questions = [generateFullDateQuestion(() => 0)]
        const events = mock()
        const { result } = renderHook(() => useDateGame({
            mode: "full", t, sessionId: 0, onSessionEvent: events, reviewQuestions: questions,
        }))
        act(() => result.current.setUserInput("ichigatsu  futsuka"))
        act(() => result.current.handleSubmit())
        expect(result.current.isCorrect).toBe(false)
        expect(events).toHaveBeenCalledWith({ type: "answer-submitted", sessionId: 0, questionId: 1, correct: false })
    })

    it("toggling showNumbers changes only the display format, not the question", () => {
        const { result } = renderHook(() =>
            useDateGame({ mode: "months", sessionId: 0, onSessionEvent: mock(), t })
        )

        const questionBefore = result.current.question
        expect(questionBefore).not.toBeNull()

        act(() => {
            result.current.setShowNumbers(true)
        })

        expect(result.current.question).toBe(questionBefore)
        expect(result.current.userInput).toBe("")

        act(() => {
            result.current.setShowNumbers(false)
        })

        expect(result.current.question).toBe(questionBefore)
    })

    it("preserves a partially typed answer across the toggle", () => {
        const { result } = renderHook(() =>
            useDateGame({ mode: "week_days", sessionId: 0, onSessionEvent: mock(), t })
        )

        act(() => {
            result.current.setUserInput("ge")
        })
        expect(result.current.userInput).toBe("ge")

        const questionBefore = result.current.question
        act(() => {
            result.current.setShowNumbers(true)
        })

        // The question itself must not change — only display formatting does —
        // and the user's in-progress answer must survive the toggle.
        expect(result.current.question).toBe(questionBefore)
        expect(result.current.userInput).toBe("ge")
    })
})
