import { describe, expect, it } from "bun:test"
import { createSession, sessionReducer, type SessionState } from "../game-session"

function answer(state: SessionState, questionId: number, correct = true) {
    return sessionReducer(state, { type: "answer-submitted", sessionId: state.sessionId, questionId, correct })
}

describe("game session reducer", () => {
    it("starts with ten rounds and empty aggregates", () => {
        expect(createSession()).toMatchObject({
            score: 0, streak: 0, bestStreak: 0,
            answeredCount: 0, correctCount: 0, skippedCount: 0,
            targetCount: 10, playMode: "session", sessionComplete: false,
        })
    })

    it.each([
        { basePoints: 10, scores: [10, 20, 30, 40, 50, 65, 80, 95, 110, 125, 145] },
        { basePoints: 1, scores: [1, 2, 3, 4, 5, 11, 17, 23, 29, 35, 46] },
    ])("awards the first two streak bonuses on answers six and eleven (base $basePoints)", ({ basePoints, scores }) => {
        let state = createSession({ basePoints, playMode: "infinite" })
        for (const [index, expectedScore] of scores.entries()) {
            state = answer(state, index + 1)
            expect(state.score).toBe(expectedScore)
            expect(state.streak).toBe(index + 1)
            expect(state.bestStreak).toBe(index + 1)
        }
        expect(state.sessionComplete).toBe(false)
    })

    it("preserves score and best streak across incorrect answers and skips", () => {
        let state = createSession()
        state = answer(state, 1)
        state = answer(state, 2)
        state = answer(state, 3, false)
        expect(state).toMatchObject({ score: 20, streak: 0, bestStreak: 2, answeredCount: 3, correctCount: 2, skippedCount: 0 })
        state = answer(state, 4)
        state = sessionReducer(state, { type: "question-skipped", sessionId: state.sessionId, questionId: 5 })
        expect(state).toMatchObject({ score: 30, streak: 0, bestStreak: 2, answeredCount: 5, correctCount: 3, skippedCount: 1 })
        state = answer(state, 6)
        expect(state.score).toBe(40)
    })

    it("counts a final skip once and ignores every outcome after completion", () => {
        let state = answer(createSession({ targetCount: 2 }), 1)
        state = sessionReducer(state, { type: "question-skipped", sessionId: state.sessionId, questionId: 2 })
        expect(state).toMatchObject({ answeredCount: 2, correctCount: 1, skippedCount: 1, score: 10, sessionComplete: true })
        expect(answer(state, 3)).toBe(state)
        expect(sessionReducer(state, { type: "question-skipped", sessionId: state.sessionId, questionId: 4 })).toBe(state)
    })

    it("rejects duplicate, out-of-order and invalid question identifiers", () => {
        const state = answer(createSession(), 4)
        for (const questionId of [4, 3, -1, 4.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
            expect(answer(state, questionId, false)).toBe(state)
            expect(sessionReducer(state, { type: "question-skipped", sessionId: state.sessionId, questionId })).toBe(state)
        }
        expect(answer(state, 5).answeredCount).toBe(2)
    })

    it("restarts without losing settings and rejects a previous session's result", () => {
        const previous = answer(createSession({ playMode: "infinite", targetCount: 4, basePoints: 1 }), 10)
        const restarted = sessionReducer(previous, { type: "session-restarted" })
        expect(restarted).toMatchObject({
            score: 0, streak: 0, bestStreak: 0, answeredCount: 0, correctCount: 0, skippedCount: 0,
            playMode: "infinite", targetCount: 4, basePoints: 1, sessionComplete: false,
            sessionId: previous.sessionId + 1,
        })
        expect(sessionReducer(restarted, { type: "answer-submitted", sessionId: previous.sessionId, questionId: 11, correct: true })).toBe(restarted)
        expect(sessionReducer(restarted, { type: "question-skipped", sessionId: previous.sessionId, questionId: 12 })).toBe(restarted)
        expect(answer(restarted, 1).score).toBe(1)
    })

    it("changes mode and target as new sessions, including a combined settings restart", () => {
        let state = answer(createSession({ targetCount: 1 }), 1)
        expect(state.sessionComplete).toBe(true)
        state = sessionReducer(state, { type: "mode-changed", playMode: "infinite" })
        expect(state).toMatchObject({ playMode: "infinite", targetCount: 1, answeredCount: 0, score: 0, sessionId: 1, sessionComplete: false })
        state = answer(answer(state, 1), 2)
        expect(state).toMatchObject({ answeredCount: 2, sessionComplete: false })
        state = sessionReducer(state, { type: "target-changed", targetCount: 3 })
        expect(state).toMatchObject({ playMode: "infinite", targetCount: 3, answeredCount: 0, score: 0, sessionId: 2 })
        state = sessionReducer(answer(state, 1), { type: "session-restarted", playMode: "session", targetCount: 2 })
        expect(state).toMatchObject({ playMode: "session", targetCount: 2, answeredCount: 0, score: 0, sessionId: 3 })
        expect(answer(answer(state, 1), 2).sessionComplete).toBe(true)
    })

    it.each([0, -1, 2.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("ignores invalid target %s", (targetCount) => {
        const state = answer(createSession(), 1)
        expect(createSession({ targetCount }).targetCount).toBe(10)
        expect(sessionReducer(state, { type: "target-changed", targetCount })).toBe(state)
        expect(sessionReducer(state, { type: "session-restarted", targetCount, playMode: "infinite" })).toBe(state)
    })
})
