"use client"

import { useState, useCallback, useRef } from "react"
import type { GameSessionProps, SessionOutcomeEvent } from "@/lib/core/game-session"

interface UseBaseGameProps extends GameSessionProps {
    disabled?: boolean
}

// Owns question feedback and admission only. The session reducer owns scoring.
export function useBaseGame({ sessionId, onSessionEvent, disabled = false }: UseBaseGameProps) {
    const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)
    const [questionId, setQuestionId] = useState(0)
    const question = useRef({ sessionId, id: 0, settled: true })

    const beginQuestion = useCallback(() => {
        question.current = { sessionId, id: question.current.id + 1, settled: false }
        setQuestionId(question.current.id)
        setFeedback(null)
    }, [sessionId])

    const emitOutcome = useCallback((outcome: { type: "answer-submitted"; correct: boolean } | { type: "question-skipped" }) => {
        const current = question.current
        if (disabled || current.settled || current.sessionId !== sessionId || current.id !== questionId) return false
        // Lock synchronously: two handlers in the same render cannot score twice.
        current.settled = true
        setFeedback(outcome.type === "answer-submitted" && outcome.correct ? "correct" : "incorrect")
        const event: SessionOutcomeEvent = { ...outcome, sessionId, questionId: current.id }
        onSessionEvent(event)
        return true
    }, [disabled, onSessionEvent, sessionId, questionId])

    const submitAnswer = useCallback((correct: boolean) => emitOutcome({ type: "answer-submitted", correct }), [emitOutcome])
    const skipQuestion = useCallback(() => emitOutcome({ type: "question-skipped" }), [emitOutcome])

    return { feedback, beginQuestion, submitAnswer, skipQuestion }
}
