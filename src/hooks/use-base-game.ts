"use client"

import { useState, useCallback } from "react"
import { useTheme } from "@/lib/theme"

export interface UseBaseGameProps {
    onScoreUpdate: (score: number, streak: number, correct: boolean) => void
}

export interface UseBaseGameReturn {
    score: number
    streak: number
    feedback: "correct" | "incorrect" | null
    setFeedback: (feedback: "correct" | "incorrect" | null) => void
    submitAnswer: (isCorrect: boolean, basePoints?: number) => void
    skipQuestion: () => void
}

export function useBaseGame({ onScoreUpdate }: UseBaseGameProps): UseBaseGameReturn {
    const [score, setScore] = useState(0)
    const [streak, setStreak] = useState(0)
    const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)

    const submitAnswer = useCallback((isCorrect: boolean, basePoints = 10) => {
        setFeedback(isCorrect ? "correct" : "incorrect")

        if (isCorrect) {
            const streakBonus = Math.floor(streak / 5) * 5
            const newScore = score + basePoints + streakBonus
            const newStreak = streak + 1
            setScore(newScore)
            setStreak(newStreak)
            onScoreUpdate(newScore, newStreak, true)
        } else {
            setStreak(0)
            onScoreUpdate(score, 0, false)
        }
    }, [score, streak, onScoreUpdate])

    const skipQuestion = useCallback(() => {
        setFeedback("incorrect")
        setStreak(0)
        onScoreUpdate(score, 0, false)
    }, [score, onScoreUpdate])

    return {
        score,
        streak,
        feedback,
        setFeedback,
        submitAnswer,
        skipQuestion,
    }
}
