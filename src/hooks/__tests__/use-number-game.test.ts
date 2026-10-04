import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "bun:test"
import { useNumberGame } from "../use-number-game"
import { useSessionProgress } from "../use-session-progress"

describe("Number answer syntax", () => {
    it("records consecutive digits as a missed answer without awarding points", () => {
        const questions = [2]
        const { result } = renderHook(() => {
            const session = useSessionProgress<number>()
            const game = useNumberGame({
                difficulty: "easy", mode: "arabicToKanji", reviewQuestions: questions,
                sessionId: session.sessionId, onSessionEvent: session.handleSessionEvent,
                onQuestionMissed: session.onQuestionMissed,
            })
            return { session, game }
        })
        act(() => { result.current.game.handleKeyPress("一"); result.current.game.handleKeyPress("二") })
        act(() => result.current.game.handleSubmit())
        expect(result.current.game).toMatchObject({ userAnswer: "一二", showResult: true, isCorrect: false })
        expect(result.current.session).toMatchObject({ score: 0, correctCount: 0, answeredCount: 1 })
        expect(result.current.session.sessionSummaryProps.missedCount).toBe(1)
    })
})
