"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { JapaneseWord, WordFilter } from "@/lib/japanese-words"
import { getRandomWord, getRandomCharacter } from "@/lib/japanese-words"
import { validateAnswer } from "@/lib/japanese-input"
import { detectErrors, type ErrorDetectionResult } from "@/lib/error-detection"
import type { GameMode } from "@/types/game"
import type { Language } from "@/lib/translations"
import { useBaseGame } from "./use-base-game"

export interface UseWordGameProps {
    mode: GameMode
    filter: WordFilter
    isCharacterMode: boolean
    disableNext: boolean
    suppressFocus: boolean
    lang: Language
    onScoreUpdate: (score: number, streak: number, correct: boolean) => void
    onIncorrectCharsChange?: (chars: Map<string, { count: number; romaji: string }>) => void
}

export interface UseWordGameReturn {
    // State
    currentWord: JapaneseWord | null
    userInput: string
    setUserInput: (value: string) => void
    feedback: "correct" | "incorrect" | null
    score: number
    streak: number
    totalAttempts: number
    correctAttempts: number
    noWordsAvailable: boolean
    isLoading: boolean
    displayRomaji: string
    errorDetails: ErrorDetectionResult | null
    incorrectChars: Map<string, { count: number; romaji: string }>
    inputRef: React.RefObject<HTMLInputElement | null>

    // Computed
    accuracyPercent: number

    // Actions
    checkAnswer: () => void
    skipWord: () => void
    handleKeyDown: (e: React.KeyboardEvent) => void
    loadNewWord: () => Promise<void>
}

export function useWordGame({
    mode,
    filter,
    isCharacterMode,
    disableNext,
    suppressFocus,
    lang,
    onScoreUpdate,
    onIncorrectCharsChange,
}: UseWordGameProps): UseWordGameReturn {
    // State
    const [currentWord, setCurrentWord] = useState<JapaneseWord | null>(null)
    const [userInput, setUserInput] = useState("")
    const [totalAttempts, setTotalAttempts] = useState(0)
    const [correctAttempts, setCorrectAttempts] = useState(0)
    const [noWordsAvailable, setNoWordsAvailable] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [displayRomaji, setDisplayRomaji] = useState("")
    const [errorDetails, setErrorDetails] = useState<ErrorDetectionResult | null>(null)
    const [incorrectChars, setIncorrectChars] = useState<Map<string, { count: number; romaji: string }>>(new Map())
    const inputRef = useRef<HTMLInputElement>(null)

    // Use unified base game logic
    const {
        score,
        streak,
        feedback,
        setFeedback,
        submitAnswer,
        skipQuestion
    } = useBaseGame({ onScoreUpdate })

    // Computed values
    const accuracyPercent = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100

    // Load new word
    const loadNewWord = useCallback(async () => {
        if (disableNext) return
        setIsLoading(true)
        let word: JapaneseWord | null

        if (isCharacterMode) {
            word = await getRandomCharacter(mode, filter)
        } else {
            word = await getRandomWord(mode, filter, lang)
        }

        if (word) {
            setCurrentWord(word)
            setDisplayRomaji(word.romaji)
            setNoWordsAvailable(false)
        } else {
            setCurrentWord(null)
            setDisplayRomaji("")
            setNoWordsAvailable(true)
        }
        setIsLoading(false)
        setUserInput("")
        setFeedback(null)
        setErrorDetails(null)
        setTimeout(() => {
            if (!suppressFocus) inputRef.current?.focus()
        }, 100)
    }, [mode, filter, suppressFocus, lang, isCharacterMode, disableNext, setFeedback])

    // Check answer
    const checkAnswer = useCallback(() => {
        if (!currentWord || !userInput.trim()) return

        const isCorrect = validateAnswer(userInput, currentWord)
        const shownAnswer = currentWord.romaji.toLowerCase().trim()

        setDisplayRomaji(shownAnswer)
        setTotalAttempts((prev) => prev + 1)

        if (isCorrect) {
            setCorrectAttempts((prev) => prev + 1)
            setErrorDetails(null)
            submitAnswer(true, 1) // Base points 1 for words
        } else {
            // Get detailed error information and accumulate incorrect chars
            detectErrors(currentWord.kana, userInput).then((result) => {
                setErrorDetails(result)
                // Accumulate incorrect characters with romaji
                setIncorrectChars((prev) => {
                    const newMap = new Map(prev)
                    for (const char of result.characters) {
                        if (!char.isCorrect) {
                            const existing = newMap.get(char.kana)
                            const romaji = char.expectedRomaji[0] || ""
                            newMap.set(char.kana, {
                                count: (existing?.count || 0) + 1,
                                romaji: existing?.romaji || romaji,
                            })
                        }
                    }
                    return newMap
                })
            })
            submitAnswer(false)
        }
    }, [currentWord, userInput, submitAnswer])

    // Skip word
    const skipWord = useCallback(() => {
        skipQuestion()
        if (currentWord) setDisplayRomaji(currentWord.romaji)
    }, [currentWord, skipQuestion])

    // Handle key down
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            if (feedback) {
                if (!disableNext) loadNewWord()
            } else {
                checkAnswer()
            }
        }
    }, [feedback, disableNext, loadNewWord, checkAnswer])

    // Load word on mount and when dependencies change
    useEffect(() => {
        loadNewWord()
    }, [loadNewWord])

    // Restore focus when suppressFocus changes
    useEffect(() => {
        if (!suppressFocus) {
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [suppressFocus])

    // Notify parent when incorrect chars change
    useEffect(() => {
        onIncorrectCharsChange?.(incorrectChars)
    }, [incorrectChars, onIncorrectCharsChange])

    return {
        // State
        currentWord,
        userInput,
        setUserInput,
        feedback,
        score,
        streak,
        totalAttempts,
        correctAttempts,
        noWordsAvailable,
        isLoading,
        displayRomaji,
        errorDetails,
        incorrectChars,
        inputRef,

        // Computed
        accuracyPercent,

        // Actions
        checkAnswer,
        skipWord,
        handleKeyDown,
        loadNewWord,
    }
}
