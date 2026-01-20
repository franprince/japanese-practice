"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { generateDateQuestion, type DateMode, type DateQuestion } from "@/lib/japanese/dates"
import { useGameScore } from "./use-game-score"
import type { TranslationKey } from "@/lib/i18n"

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
    handleDelete: () => void
    handleClear: () => void
    handleKeyDown: (e: React.KeyboardEvent) => void
    handleKeyUp: (e: React.KeyboardEvent) => void
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
    const [showResult, setShowResult] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)
    const [showNumbers, setShowNumbers] = useState(false)
    const enterOnResultRef = useRef(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const { updateScore } = useGameScore(onScoreUpdate)

    const generateNewQuestion = useCallback(() => {
        if (disableNext) return
        enterOnResultRef.current = false
        setQuestion(generateDateQuestion(mode, t, showNumbers))
        setUserInput("")
        setShowResult(false)
        setIsCorrect(false)
    }, [mode, disableNext, showNumbers, t])

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

        setIsCorrect(correct)
        setShowResult(true)
        updateScore(correct)
    }, [question, userInput, updateScore])

    const handleSkip = useCallback(() => {
        updateScore(false)
        generateNewQuestion()
    }, [updateScore, generateNewQuestion])

    const handleDelete = useCallback(() => {
        setUserInput(userInput.slice(0, -1))
    }, [userInput])

    const handleClear = useCallback(() => {
        setUserInput("")
    }, [])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            if (showResult && !disableNext) {
                e.preventDefault()
                enterOnResultRef.current = true
            } else if (!showResult) {
                handleSubmit()
            }
        } else if (e.key === "Backspace" && !showResult) {
            e.preventDefault()
            handleDelete()
        } else if (e.key === "Escape" && !showResult) {
            handleClear()
        }
    }, [showResult, disableNext, handleSubmit, handleDelete, handleClear])

    const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter" && showResult && !disableNext) {
            if (!enterOnResultRef.current) return
            e.preventDefault()
            enterOnResultRef.current = false
            generateNewQuestion()
        }
    }, [showResult, disableNext, generateNewQuestion])

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
        handleDelete,
        handleClear,
        handleKeyDown,
        handleKeyUp,
        generateNewQuestion,
    }
}
