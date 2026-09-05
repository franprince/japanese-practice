import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "bun:test"
import { useMistakeReview } from "../use-mistake-review"

type Question = { id: string; prompt: string }

const question = (id: string): Question => ({ id, prompt: `question ${id}` })

describe("useMistakeReview", () => {
  it("deduplicates missed questions using the supplied key", () => {
    const { result } = renderHook(() => useMistakeReview<Question>(1, item => item.id))
    const first = question("a")

    act(() => {
      result.current.onQuestionMissed(first)
      result.current.onQuestionMissed({ ...first, prompt: "same question" })
      result.current.onQuestionMissed(question("b"))
    })

    expect(result.current.missedQuestions).toEqual([first, question("b")])
  })

  it("returns null for an empty review and the recorded queue otherwise", () => {
    const { result } = renderHook(() => useMistakeReview<Question>(1, item => item.id))
    expect(result.current.beginReview()).toBeNull()

    const missed = question("a")
    act(() => result.current.onQuestionMissed(missed))
    expect(result.current.beginReview()).toEqual([missed])
  })

  it("exposes an empty queue for a new session", () => {
    const { result, rerender } = renderHook(({ sessionId }) => useMistakeReview<Question>(sessionId, item => item.id), { initialProps: { sessionId: 1 } })
    act(() => result.current.onQuestionMissed(question("old")))

    rerender({ sessionId: 2 })
    expect(result.current.missedQuestions).toEqual([])
    expect(result.current.beginReview()).toBeNull()
  })

  it("does not let a stale callback overwrite a newer session", () => {
    const { result, rerender } = renderHook(({ sessionId }) => useMistakeReview<Question>(sessionId, item => item.id), { initialProps: { sessionId: 1 } })
    const staleCallback = result.current.onQuestionMissed
    rerender({ sessionId: 2 })

    act(() => {
      result.current.onQuestionMissed(question("new"))
      staleCallback(question("stale"))
    })

    expect(result.current.missedQuestions).toEqual([question("new")])
  })

  it("stores and clears an active review", () => {
    const { result } = renderHook(() => useMistakeReview<Question>(1, item => item.id))
    const questions = [question("a"), question("b")]

    act(() => result.current.setReview({ questions, originalTarget: 10 }))
    expect(result.current.review).toEqual({ questions, originalTarget: 10 })

    act(() => result.current.clearReview())
    expect(result.current.review).toBeNull()
  })
})
