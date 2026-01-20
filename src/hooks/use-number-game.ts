"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
    generateRandomNumber,
    arabicToJapanese,
    japaneseToArabic,
    difficultyRanges,
    japaneseNumbers,
    type Difficulty,
} from "@/lib/japanese-numbers"
import { useGameScore } from "./use-game-score"
import { useKeyboardNavigation } from "./use-keyboard-navigation"

export interface UseNumberGameProps {
    difficulty: Difficulty
    mode: "arabicToKanji" | "kanjiToArabic"
    onScoreUpdate: (score: number, streak: number, correct: boolean) => void
    disableNext?: boolean
}

export interface UseNumberGameReturn {
    // State
    currentNumber: number
    userAnswer: string
    showResult: boolean
    isCorrect: boolean
    shuffleNumbers: boolean
    setShuffleNumbers: (value: boolean) => void
    correctAnswerKanji: string
    correctAnswerRomaji: string
    questionText: string
    correctAnswerDisplay: string

    // Actions
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
    onScoreUpdate,
    disableNext = false,
}: UseNumberGameProps): UseNumberGameReturn {
    const [currentNumber, setCurrentNumber] = useState<number>(1)
    const [userAnswer, setUserAnswer] = useState("")
    const [showResult, setShowResult] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)
    const { updateScore } = useGameScore(onScoreUpdate)
    const [shuffleNumbers, setShuffleNumbers] = useState(true)

    const generateNewNumber = useCallback(() => {
        const range = difficultyRanges[difficulty]
        const newNumber = generateRandomNumber(range.min, range.max)
        setCurrentNumber(newNumber)
        setUserAnswer("")
        setShowResult(false)
    }, [difficulty])

    useEffect(() => {
        generateNewNumber()
    }, [generateNewNumber])

    const handleKeyPress = useCallback((key: string) => {
        if (showResult || disableNext) return
        setUserAnswer((prev) => prev + key)
    }, [showResult, disableNext])

    const handleDelete = useCallback(() => {
        if (showResult || disableNext) return
        setUserAnswer((prev) => prev.slice(0, -1))
    }, [showResult, disableNext])

    const handleClear = useCallback(() => {
        if (showResult || disableNext) return
        setUserAnswer("")
    }, [showResult, disableNext])

    const handleSubmit = useCallback(() => {
        if (showResult || !userAnswer || disableNext) return

        const userValue = mode === "arabicToKanji" ? japaneseToArabic(userAnswer) : Number(userAnswer)
        const correct = userValue === currentNumber

        setIsCorrect(correct)
        setShowResult(true)
        updateScore(correct, 1)
    }, [showResult, userAnswer, disableNext, mode, currentNumber, updateScore])

    const handleNext = useCallback(() => {
        if (disableNext) return
        generateNewNumber()
    }, [disableNext, generateNewNumber])

    const handleSkip = useCallback(() => {
        updateScore(false)
        generateNewNumber()
    }, [updateScore, generateNewNumber])

    useKeyboardNavigation(
        {
            onEnter: showResult ? handleNext : (userAnswer ? handleSubmit : undefined),
            onBackspace: !showResult ? handleDelete : undefined,
            onEscape: !showResult ? handleClear : undefined,
        },
        !disableNext
    )

    // Always keep shuffle off in Kanji → Arabic mode
    useEffect(() => {
        if (mode === "kanjiToArabic") {
            setShuffleNumbers(false)
        } else {
            setShuffleNumbers(true)
        }
    }, [mode])

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
        // State
        currentNumber,
        userAnswer,
        showResult,
        isCorrect,
        shuffleNumbers,
        setShuffleNumbers,
        correctAnswerKanji,
        correctAnswerRomaji,
        questionText,
        correctAnswerDisplay,

        // Actions
        handleKeyPress,
        handleDelete,
        handleClear,
        handleSubmit,
        handleNext,
        handleSkip,
    }
}
