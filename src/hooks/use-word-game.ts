"use client"

import { useState, useEffect, useRef, useCallback, useTransition } from "react"
import type { JapaneseWord, WordFilter } from "@/lib/japanese/words"
import { getRandomWord, getRandomCharacter } from "@/lib/japanese/words"
import { confirmWordset, normalizeLang } from "@/lib/japanese/words/loader"
import { validateAnswer } from "@/lib/japanese/shared/input"
import { detectErrors, type ErrorDetectionResult } from "@/lib/japanese/shared/error-detection"
import type { GameMode } from "@/types/game"
import type { Language } from "@/lib/i18n/translations"
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

    
    accuracyPercent: number

    
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

    
    const [, startTransition] = useTransition()

    
    const {
        score,
        streak,
        feedback,
        setFeedback,
        submitAnswer,
        skipQuestion
    } = useBaseGame({ onScoreUpdate })

    
    const accuracyPercent = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100

    
    const loadNewWord = useCallback(async () => {
        if (disableNext) return
        setIsLoading(true)
        let word: JapaneseWord | null = null

        try {
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
        } catch (error: any) {
            console.error("Failed to load word:", error)
        } finally {
            setIsLoading(false)
        }

        if (word) {
            setUserInput("")
            setFeedback(null)
            setErrorDetails(null)
            
            requestAnimationFrame(() => {
                if (!suppressFocus) inputRef.current?.focus()
            })
        }
    }, [mode, filter, suppressFocus, lang, isCharacterMode, disableNext, setFeedback])



    const checkAnswer = useCallback(async () => {
        if (!currentWord || !userInput.trim()) return

        let isCorrect = validateAnswer(userInput, currentWord)
        let detectionResult: ErrorDetectionResult | null = null

        
        if (!isCorrect) {
            try {
                detectionResult = await detectErrors(currentWord.kana, userInput)
                if (detectionResult.isFullyCorrect) {
                    isCorrect = true
                }
            } catch (e) {
                console.error("Validation error:", e)
            }
        }

        const shownAnswer = currentWord.romaji.toLowerCase().trim()

        setDisplayRomaji(shownAnswer)
        setTotalAttempts((prev) => prev + 1)

        if (isCorrect) {
            setCorrectAttempts((prev) => prev + 1)
            setErrorDetails(null)
            submitAnswer(true, 1) 
        } else {
            
            submitAnswer(false)

            
            const handleDetectionResult = (result: ErrorDetectionResult) => {
                startTransition(() => {
                    setErrorDetails(result)
                    
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
            }

            if (detectionResult) {
                handleDetectionResult(detectionResult)
            } else {
                
                
                
                detectErrors(currentWord.kana, userInput).then(handleDetectionResult)
            }
        }
    }, [currentWord, userInput, submitAnswer, startTransition])

    
    const skipWord = useCallback(() => {
        skipQuestion()
        if (currentWord) setDisplayRomaji(currentWord.romaji)
    }, [currentWord, skipQuestion])

    
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            if (feedback) {
                if (!disableNext) loadNewWord()
            } else {
                checkAnswer()
            }
        }
    }, [feedback, disableNext, loadNewWord, checkAnswer])

    
    useEffect(() => {
        loadNewWord()
    }, [loadNewWord])

    
    useEffect(() => {
        if (!suppressFocus) {
            requestAnimationFrame(() => inputRef.current?.focus())
        }
    }, [suppressFocus])

    
    useEffect(() => {
        onIncorrectCharsChange?.(incorrectChars)
    }, [incorrectChars, onIncorrectCharsChange])

    return {
        
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

        
        accuracyPercent,

        
        checkAnswer,
        skipWord,
        handleKeyDown,
        loadNewWord,
    }
}
