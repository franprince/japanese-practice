"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { generateDateQuestion, type DateMode, type DateQuestion } from "@/lib/japanese/dates"
import { useBaseGame } from "./use-base-game"
import type { GameSessionProps } from "@/lib/core/game-session"
import { useKeyboardNavigation } from "./use-keyboard-navigation"
import type { TranslationKey } from "@/lib/i18n/translations"

export interface UseDateGameProps extends GameSessionProps {
    mode: DateMode
    disableNext?: boolean
    t: (key: TranslationKey) => string
}

export interface UseDateGameReturn {
    
    question: DateQuestion | null
    userInput: string
    setUserInput: (value: string) => void
    showResult: boolean
    isCorrect: boolean
    showNumbers: boolean
    setShowNumbers: (value: boolean) => void
    inputRef: React.RefObject<HTMLInputElement | null>

    
    handleSubmit: () => void
    handleSkip: () => void
    generateNewQuestion: () => void
}

export function useDateGame({
    mode,
    sessionId,
    onSessionEvent,
    disableNext = false,
    t,
}: UseDateGameProps): UseDateGameReturn {
    const [question, setQuestion] = useState<DateQuestion | null>(null)
    const [userInput, setUserInput] = useState("")
    const [numberDisplay, setNumberDisplay] = useState({ sessionId, visible: false })
    const showNumbers = numberDisplay.sessionId === sessionId && numberDisplay.visible
    const setShowNumbers = useCallback((visible: boolean) => {
        setNumberDisplay({ sessionId, visible })
    }, [sessionId])
    const inputRef = useRef<HTMLInputElement>(null)

    
    const {
        feedback,
        beginQuestion,
        submitAnswer,
        skipQuestion
    } = useBaseGame({ sessionId, onSessionEvent, disabled: disableNext })

    const showResult = feedback !== null
    const isCorrect = feedback === "correct"

    const generateNewQuestion = useCallback(() => {
        setQuestion(generateDateQuestion(mode, t))
        setUserInput("")
        beginQuestion()
    }, [mode, t, beginQuestion])

    useEffect(() => {
        if (!disableNext) generateNewQuestion()
    }, [generateNewQuestion, disableNext])

    useEffect(() => {
        if (!showResult && !disableNext && inputRef.current) {
            inputRef.current.focus()
        }
    }, [showResult, question, disableNext])

    const handleSubmit = useCallback(() => {
        if (!question || showResult || disableNext || !userInput.trim()) return

        const userAnswer = userInput.trim().toLowerCase()
        const normalizedAnswer = question.answer.toLowerCase()
        const normalizedRomaji = question.romaji.toLowerCase().replace(/\s+/g, "")

        const correct = userAnswer === normalizedAnswer || userAnswer === normalizedRomaji

        submitAnswer(correct)
    }, [question, showResult, disableNext, userInput, submitAnswer])

    const handleNext = useCallback(() => {
        if (disableNext) return
        generateNewQuestion()
    }, [disableNext, generateNewQuestion])

    const handleSkip = useCallback(() => {
        if (disableNext || !skipQuestion()) return
        generateNewQuestion()
    }, [disableNext, skipQuestion, generateNewQuestion])

    const handleDelete = useCallback(() => {
        if (showResult || disableNext) return
        setUserInput(userInput.slice(0, -1))
    }, [showResult, disableNext, userInput])

    const handleClear = useCallback(() => {
        if (showResult || disableNext) return
        setUserInput("")
    }, [showResult, disableNext])

    useKeyboardNavigation(
        {
            onEnter: showResult ? handleNext : handleSubmit,
            onBackspace: !showResult ? handleDelete : undefined,
            onEscape: !showResult ? handleClear : undefined,
        },
        !disableNext
    )

    return {
        
        question,
        userInput,
        setUserInput,
        showResult,
        isCorrect,
        showNumbers,
        setShowNumbers,
        inputRef,

        
        handleSubmit,
        handleSkip,
        generateNewQuestion: handleNext,
    }
}
