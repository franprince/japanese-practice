export type PlayMode = "infinite" | "session"

export interface SessionOptions {
    targetCount?: number
    playMode?: PlayMode
    basePoints?: number
}

export interface SessionState {
    score: number
    streak: number
    bestStreak: number
    answeredCount: number
    correctCount: number
    skippedCount: number
    targetCount: number
    playMode: PlayMode
    sessionComplete: boolean
    sessionId: number
    lastQuestionId: number
    basePoints: number
}

type QuestionIdentity = { sessionId: number; questionId: number }
export type SessionOutcomeEvent =
    | (QuestionIdentity & { type: "answer-submitted"; correct: boolean })
    | (QuestionIdentity & { type: "question-skipped" })

export type SessionEvent = SessionOutcomeEvent
    | { type: "session-restarted"; playMode?: PlayMode; targetCount?: number }
    | { type: "mode-changed"; playMode: PlayMode }
    | { type: "target-changed"; targetCount: number }

export interface GameSessionProps {
    sessionId: number
    onSessionEvent: (event: SessionOutcomeEvent) => void
}

function validTarget(target: number) {
    return Number.isSafeInteger(target) && target > 0
}

export function createSession({ targetCount = 10, playMode = "session", basePoints = 10 }: SessionOptions = {}): SessionState {
    return {
        score: 0, streak: 0, bestStreak: 0,
        answeredCount: 0, correctCount: 0, skippedCount: 0,
        targetCount: validTarget(targetCount) ? targetCount : 10,
        playMode, basePoints, sessionComplete: false, sessionId: 0, lastQuestionId: -1,
    }
}

export function sessionReducer(state: SessionState, event: SessionEvent): SessionState {
    switch (event.type) {
        case "session-restarted":
        case "mode-changed":
        case "target-changed": {
            const targetCount = "targetCount" in event ? event.targetCount ?? state.targetCount : state.targetCount
            if (!validTarget(targetCount)) return state
            const playMode = "playMode" in event ? event.playMode ?? state.playMode : state.playMode
            return {
                ...createSession({ targetCount, playMode, basePoints: state.basePoints }),
                sessionId: state.sessionId + 1,
            }
        }
        case "answer-submitted":
        case "question-skipped": {
            if (event.sessionId !== state.sessionId || state.sessionComplete ||
                !Number.isSafeInteger(event.questionId) || event.questionId <= state.lastQuestionId) return state
            const correct = event.type === "answer-submitted" && event.correct
            const streak = correct ? state.streak + 1 : 0
            const answeredCount = state.answeredCount + 1
            return {
                ...state,
                score: state.score + (correct ? state.basePoints + Math.floor(state.streak / 5) * 5 : 0),
                streak,
                bestStreak: Math.max(state.bestStreak, streak),
                answeredCount,
                correctCount: state.correctCount + Number(correct),
                skippedCount: state.skippedCount + Number(event.type === "question-skipped"),
                sessionComplete: state.playMode === "session" && answeredCount >= state.targetCount,
                lastQuestionId: event.questionId,
            }
        }
    }
}
