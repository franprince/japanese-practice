"use client"

import { useState, useCallback } from "react"

/**
 * Hook for managing game score and streak with consistent scoring logic
 */
export function useGameScore(
    onScoreUpdate: (score: number, streak: number, correct: boolean) => void
) {
    const [score, setScore] = useState(0)
    const [streak, setStreak] = useState(0)

    const updateScore = useCallback((isCorrect: boolean, basePoints = 10) => {
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

    const resetScore = useCallback(() => {
        setScore(0)
        setStreak(0)
    }, [])

    return { score, streak, updateScore, resetScore }
}
