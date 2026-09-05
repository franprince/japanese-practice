"use client"
import type { PracticeReviewProps } from "./use-mistake-review"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { generateDateQuestion, type DateMode, type DateQuestion } from "@/lib/japanese/dates"
import { createRandomSeed, createSeededRandom } from "@/lib/core/random"
import { useHydrated } from "./use-hydrated"
import { useBaseGame } from "./use-base-game"
import type { GameSessionProps } from "@/lib/core/game-session"
import { useKeyboardNavigation } from "./use-keyboard-navigation"
import type { TranslationKey } from "@/lib/i18n/translations"

export interface UseDateGameProps extends GameSessionProps, PracticeReviewProps<DateQuestion> {
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
    reviewQuestions,
    onQuestionMissed,
    t,
}: UseDateGameProps): UseDateGameReturn {
    const hydrated = useHydrated()
    const [round, setRound] = useState(() => ({ sessionId, mode, translate: t, index: 0, id: 1, seed: createRandomSeed(), input: "" }))
    if (round.sessionId !== sessionId || (!disableNext && (round.mode !== mode || round.translate !== t))) {
        setRound({ sessionId, mode, translate: t, index: 0, id: round.id + 1, seed: round.seed + 1, input: "" })
    }
    const generated = useMemo(() => generateDateQuestion(round.mode, round.translate, createSeededRandom(round.seed)),
        [round.mode, round.translate, round.seed])
    const question = hydrated ? (reviewQuestions?.length ? reviewQuestions[round.index % reviewQuestions.length]! : generated) : null
    const userInput = round.input
    const setUserInput = useCallback((input: string) => setRound(previous => ({ ...previous, input })), [])
    const [numberDisplay, setNumberDisplay] = useState({ sessionId, visible: false })
    const showNumbers = numberDisplay.sessionId === sessionId && numberDisplay.visible
    const setShowNumbers = useCallback((visible: boolean) => {
        setNumberDisplay({ sessionId, visible })
    }, [sessionId])
    const inputRef = useRef<HTMLInputElement>(null)

    
    const {
        feedback,
        isCurrentQuestion,
        submitAnswer,
        skipQuestion
    } = useBaseGame({ sessionId, questionId: round.id, onSessionEvent, disabled: disableNext || !hydrated })

    const showResult = feedback !== null
    const isCorrect = feedback === "correct"

    const generateNewQuestion = useCallback(() => {
        if (!isCurrentQuestion()) return
        setRound({ sessionId, mode, translate: t, index: round.index + 1, id: round.id + 1, seed: createRandomSeed(), input: "" })
    }, [sessionId, mode, t, round.index, round.id, isCurrentQuestion])

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

        if (submitAnswer(correct) && !correct) onQuestionMissed?.(question)
    }, [question, showResult, disableNext, userInput, submitAnswer, onQuestionMissed])

    const handleNext = useCallback(() => {
        if (disableNext) return
        generateNewQuestion()
    }, [disableNext, generateNewQuestion])

    const handleSkip = useCallback(() => {
        if (disableNext || !skipQuestion()) return
        if (question) onQuestionMissed?.(question)
        generateNewQuestion()
    }, [disableNext, skipQuestion, generateNewQuestion, question, onQuestionMissed])

    const handleDelete = useCallback(() => {
        if (showResult || disableNext) return
        setUserInput(userInput.slice(0, -1))
    }, [showResult, disableNext, userInput, setUserInput])

    const handleClear = useCallback(() => {
        if (showResult || disableNext) return
        setUserInput("")
    }, [showResult, disableNext, setUserInput])

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
