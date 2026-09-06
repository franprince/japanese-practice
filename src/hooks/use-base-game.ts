"use client"

import { useState, useCallback, useRef, useLayoutEffect } from "react"
import type { GameSessionProps, SessionOutcomeEvent } from "@/lib/core/game-session"

interface UseBaseGameProps extends GameSessionProps {
    questionId: number
    disabled?: boolean
}

// Owns question feedback and admission only. The session reducer owns scoring.
export function useBaseGame({ sessionId, questionId, onSessionEvent, disabled = false }: UseBaseGameProps) {
    const [result, setResult] = useState<{ sessionId: number; questionId: number; correct: boolean } | null>(null)
    const question = useRef({ sessionId, questionId, settled: false, active: false, disabled })
    useLayoutEffect(() => {
        const previous = question.current
        question.current = {
            sessionId, questionId, active: true, disabled,
            settled: previous.sessionId === sessionId && previous.questionId === questionId && previous.settled,
        }
        return () => { question.current.active = false }
    }, [sessionId, questionId, disabled])

    const isCurrentQuestion = useCallback(() => {
        const current = question.current
        return !disabled && !current.disabled && current.active && current.sessionId === sessionId && current.questionId === questionId
    }, [disabled, sessionId, questionId])
    const emitOutcome = useCallback((outcome: { type: "answer-submitted"; correct: boolean } | { type: "question-skipped" }) => {
        if (!isCurrentQuestion() || question.current.settled) return false
        question.current.settled = true
        setResult({ sessionId, questionId, correct: outcome.type === "answer-submitted" && outcome.correct })
        const event: SessionOutcomeEvent = { ...outcome, sessionId, questionId }
        onSessionEvent(event)
        return true
    }, [isCurrentQuestion, onSessionEvent, sessionId, questionId])

    const feedback = result?.sessionId === sessionId && result.questionId === questionId
        ? result.correct ? "correct" as const : "incorrect" as const : null
    const submitAnswer = useCallback((correct: boolean) => emitOutcome({ type: "answer-submitted", correct }), [emitOutcome])
    const skipQuestion = useCallback(() => emitOutcome({ type: "question-skipped" }), [emitOutcome])
    return { feedback, submitAnswer, skipQuestion, isCurrentQuestion }
}
