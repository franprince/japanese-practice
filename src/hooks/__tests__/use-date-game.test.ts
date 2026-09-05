import { describe, expect, it, mock } from "bun:test"
import { renderHook, act } from "@testing-library/react"
import { useDateGame } from "../use-date-game"

const t = (key: string) => key

describe("useDateGame", () => {
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
