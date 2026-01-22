"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { generateDateQuestion, type DateMode, type DateQuestion } from "@/lib/japanese/dates"
import { useBaseGame } from "./use-base-game"
import { useKeyboardNavigation } from "./use-keyboard-navigation"
import type { TranslationKey } from "@/lib/i18n/translations"

export interface UseDateGameProps {
    mode: DateMode
    onScoreUpdate: (score: number, streak: number, correct: boolean) => void
    disableNext?: boolean
    t: (key: TranslationKey) => string
}

export interface UseDateGameReturn {
    // State
    question: DateQuestion | null
    userInput: string
    setUserInput: (value: string) => void
    showResult: boolean
    isCorrect: boolean
    showNumbers: boolean
    setShowNumbers: (value: boolean) => void
    inputRef: React.RefObject<HTMLInputElement | null>

    // Actions
    handleSubmit: () => void
    handleSkip: () => void
    generateNewQuestion: () => void
}

export function useDateGame({
    mode,
    onScoreUpdate,
    disableNext = false,
    t,
}: UseDateGameProps): UseDateGameReturn {
    const [question, setQuestion] = useState<DateQuestion | null>(null)
    const [userInput, setUserInput] = useState("")
    const [showNumbers, setShowNumbers] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Use unified base game logic
    const {
        feedback,
        setFeedback,
        submitAnswer,
        skipQuestion
    } = useBaseGame({ onScoreUpdate })

    const showResult = feedback !== null
    const isCorrect = feedback === "correct"

    const generateNewQuestion = useCallback(() => {
        if (disableNext) return
        setQuestion(generateDateQuestion(mode, t, showNumbers))
        setUserInput("")
        setFeedback(null)
    }, [mode, disableNext, showNumbers, t, setFeedback])

    useEffect(() => {
        generateNewQuestion()
    }, [generateNewQuestion, showNumbers])

    useEffect(() => {
        if (!showResult && inputRef.current) {
            inputRef.current.focus()
        }
    }, [showResult, question])

    const handleSubmit = useCallback(() => {
        if (!question) return

        const userAnswer = userInput.trim().toLowerCase()
        const normalizedAnswer = question.answer.toLowerCase()
        const normalizedRomaji = question.romaji.toLowerCase().replace(/\s+/g, "")

        const correct = userAnswer === normalizedAnswer || userAnswer === normalizedRomaji

        submitAnswer(correct)
    }, [question, userInput, submitAnswer])

    const handleSkip = useCallback(() => {
        skipQuestion()
        generateNewQuestion()
    }, [skipQuestion, generateNewQuestion])

    const handleDelete = useCallback(() => {
        setUserInput(userInput.slice(0, -1))
    }, [userInput])

    const handleClear = useCallback(() => {
        setUserInput("")
    }, [])

    useKeyboardNavigation(
        {
            onEnter: showResult ? (disableNext ? undefined : generateNewQuestion) : handleSubmit,
            onBackspace: !showResult ? handleDelete : undefined,
            onEscape: !showResult ? handleClear : undefined,
        },
        true
    )

    return {
        // State
        question,
        userInput,
        setUserInput,
        showResult,
        isCorrect,
        showNumbers,
        setShowNumbers,
        inputRef,

        // Actions
        handleSubmit,
        handleSkip,
        generateNewQuestion,
    }
}
