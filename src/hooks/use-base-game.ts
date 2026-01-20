"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useTheme } from "@/lib/theme-context"

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
    playSound: (type: "correct" | "incorrect") => void
}

export function useBaseGame({ onScoreUpdate }: UseBaseGameProps): UseBaseGameReturn {
    const [score, setScore] = useState(0)
    const [streak, setStreak] = useState(0)
    const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)

    // Audio refs
    const correctSound = useRef<HTMLAudioElement | null>(null)
    const incorrectSound = useRef<HTMLAudioElement | null>(null)

    // Initialize sounds
    useEffect(() => {
        correctSound.current = new Audio("/sounds/correct.mp3")
        incorrectSound.current = new Audio("/sounds/incorrect.mp3")

        // Preload
        correctSound.current.load()
        incorrectSound.current.load()

        // Cleanup
        return () => {
            correctSound.current = null
            incorrectSound.current = null
        }
    }, [])

    const playSound = useCallback((type: "correct" | "incorrect") => {
        // Basic mute toggle could be added here later
        const sound = type === "correct" ? correctSound.current : incorrectSound.current
        if (sound) {
            sound.currentTime = 0
            sound.play().catch(() => {
                // Ignore auto-play blocking errors
            })
        }
    }, [])

    const submitAnswer = useCallback((isCorrect: boolean, basePoints = 10) => {
        setFeedback(isCorrect ? "correct" : "incorrect")

        // Play sound immediately
        playSound(isCorrect ? "correct" : "incorrect")

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
    }, [score, streak, onScoreUpdate, playSound])

    const skipQuestion = useCallback(() => {
        setFeedback("incorrect")
        // playSound("incorrect") // Optional: decice if skip should play error sound. Usually silent or subtle.

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
        playSound
    }
}
