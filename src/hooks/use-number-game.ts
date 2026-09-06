"use client"
import type { PracticeReviewProps } from "./use-mistake-review"

import { useState, useCallback, useMemo } from "react"
import {
    generateRandomNumber,
    arabicToJapanese,
    japaneseToArabic,
    difficultyRanges,
    japaneseNumbers,
    type Difficulty,
} from "@/lib/japanese/numbers"
import { createRandomSeed, createSeededRandom } from "@/lib/core/random"
import { useHydrated } from "./use-hydrated"
import { useBaseGame } from "./use-base-game"
import type { GameSessionProps } from "@/lib/core/game-session"
import { useKeyboardNavigation } from "./use-keyboard-navigation"

export interface UseNumberGameProps extends GameSessionProps, PracticeReviewProps<number> {
    difficulty: Difficulty
    mode: "arabicToKanji" | "kanjiToArabic"
    disableNext?: boolean
}

export interface UseNumberGameReturn {
    
    isReady: boolean
    currentNumber: number
    userAnswer: string
    showResult: boolean
    isCorrect: boolean
    shuffleNumbers: boolean
    correctAnswerKanji: string
    correctAnswerRomaji: string
    questionText: string
    correctAnswerDisplay: string

    
    handleKeyPress: (key: string) => void
    handleDelete: () => void
    handleClear: () => void
    handleSubmit: () => void
    handleNext: () => void
    handleSkip: () => void
}

export function useNumberGame({
    difficulty,
    mode,
    sessionId,
    onSessionEvent,
    disableNext = false,
    reviewQuestions,
    onQuestionMissed,
}: UseNumberGameProps): UseNumberGameReturn {
    const isReady = useHydrated()
    const [round, setRound] = useState(() => ({ sessionId, difficulty, index: 0, id: 1, seed: createRandomSeed(), input: "" }))
    if (round.sessionId !== sessionId || round.difficulty !== difficulty) {
        setRound({ sessionId, difficulty, index: 0, id: round.id + 1, seed: round.seed + 1, input: "" })
    }
    const currentNumber = useMemo(() => {
        if (reviewQuestions?.length) return reviewQuestions[round.index % reviewQuestions.length]!
        const range = difficultyRanges[round.difficulty]
        return generateRandomNumber(range.min, range.max, createSeededRandom(round.seed))
    }, [round.difficulty, round.seed, round.index, reviewQuestions])
    const userAnswer = round.input
    const setUserAnswer = useCallback((next: string | ((previous: string) => string)) => {
        setRound(previous => ({ ...previous, input: typeof next === "function" ? next(previous.input) : next }))
    }, [])
    const { feedback, submitAnswer, skipQuestion, isCurrentQuestion } = useBaseGame({
        sessionId, questionId: round.id, onSessionEvent, disabled: disableNext || !isReady,
    })
    const showResult = feedback !== null
    const isCorrect = feedback === "correct"
    const generateNewNumber = useCallback(() => {
        if (!isCurrentQuestion()) return
        setRound({ sessionId, difficulty, index: round.index + 1, id: round.id + 1, seed: createRandomSeed(), input: "" })
    }, [sessionId, difficulty, round.index, round.id, isCurrentQuestion])

    const handleKeyPress = useCallback((key: string) => {
        if (showResult || disableNext) return
        setUserAnswer((prev) => prev + key)
    }, [showResult, disableNext, setUserAnswer])

    const handleDelete = useCallback(() => {
        if (showResult || disableNext) return
        setUserAnswer((prev) => prev.slice(0, -1))
    }, [showResult, disableNext, setUserAnswer])

    const handleClear = useCallback(() => {
        if (showResult || disableNext) return
        setUserAnswer("")
    }, [showResult, disableNext, setUserAnswer])

    const handleSubmit = useCallback(() => {
        if (showResult || !userAnswer || disableNext) return

        const userValue = mode === "arabicToKanji" ? japaneseToArabic(userAnswer) : Number(userAnswer)
        const correct = userValue === currentNumber

        if (submitAnswer(correct) && !correct) onQuestionMissed?.(currentNumber)
    }, [showResult, userAnswer, disableNext, mode, currentNumber, submitAnswer, onQuestionMissed])

    const handleNext = useCallback(() => {
        if (disableNext) return
        generateNewNumber()
    }, [disableNext, generateNewNumber])

    const handleSkip = useCallback(() => {
        if (disableNext || !skipQuestion()) return
        onQuestionMissed?.(currentNumber)
        generateNewNumber()
    }, [disableNext, skipQuestion, generateNewNumber, onQuestionMissed, currentNumber])

    useKeyboardNavigation(
        {
            onEnter: showResult ? handleNext : (userAnswer ? handleSubmit : undefined),
            onBackspace: !showResult ? handleDelete : undefined,
            onEscape: !showResult ? handleClear : undefined,
        },
        !disableNext
    )

    
    const shuffleNumbers = mode !== "kanjiToArabic"

    const correctAnswerKanji = arabicToJapanese(currentNumber)
    const questionText = mode === "arabicToKanji" ? currentNumber.toLocaleString() : correctAnswerKanji
    const correctAnswerDisplay = mode === "arabicToKanji" ? correctAnswerKanji : currentNumber.toLocaleString()

    const correctAnswerRomaji = useMemo(() => {
        const toRomaji = (jp: string) =>
            jp
                .split("")
                .map((char) => japaneseNumbers[char as keyof typeof japaneseNumbers]?.reading ?? char)
                .join(" ")
        return toRomaji(correctAnswerKanji)
    }, [correctAnswerKanji])

    return {
        
        isReady,
        currentNumber,
        userAnswer,
        showResult,
        isCorrect,
        shuffleNumbers,
        correctAnswerKanji,
        correctAnswerRomaji,
        questionText,
        correctAnswerDisplay,

        
        handleKeyPress,
        handleDelete,
        handleClear,
        handleSubmit,
        handleNext,
        handleSkip,
    }
}
