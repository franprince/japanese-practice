"use client"

import { useState, useEffect, useRef, useCallback, useTransition } from "react"
import type { JapaneseWord, WordFilter } from "@/lib/japanese/words"
import { getRandomWord, getRandomCharacter } from "@/lib/japanese/words"
import { validateAnswer } from "@/lib/japanese/shared/input"
import { detectErrors, type ErrorDetectionResult } from "@/lib/japanese/shared/error-detection"
import { shuffleArray } from "@/lib/core/random"
import type { GameMode, WordsGameType } from "@/types/game"
import type { Language } from "@/lib/i18n/translations"
import { useBaseGame } from "./use-base-game"

export interface UseWordGameProps {
    mode: GameMode
    filter: WordFilter
    gameType: WordsGameType
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
    options: string[] | null

    
    accuracyPercent: number

    
    checkAnswer: (value?: string) => void
    skipWord: () => void
    handleKeyDown: (e: React.KeyboardEvent) => void
    loadNewWord: () => Promise<void>
}

export function useWordGame({
    mode,
    filter,
    gameType,
    disableNext,
    suppressFocus,
    lang,
    onScoreUpdate,
    onIncorrectCharsChange,
}: UseWordGameProps): UseWordGameReturn {
    
    const [currentWord, setCurrentWord] = useState<JapaneseWord | null>(null)
    const [userInput, setUserInput] = useState("")
    const [options, setOptions] = useState<string[] | null>(null)
    const [totalAttempts, setTotalAttempts] = useState(0)
    const [correctAttempts, setCorrectAttempts] = useState(0)
    const [noWordsAvailable, setNoWordsAvailable] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [displayRomaji, setDisplayRomaji] = useState("")
    const [errorDetails, setErrorDetails] = useState<ErrorDetectionResult | null>(null)
    const [incorrectChars, setIncorrectChars] = useState<Map<string, { count: number; romaji: string }>>(new Map())
    const inputRef = useRef<HTMLInputElement>(null)

    
    const [, startTransition] = useTransition()

    // Guards against an in-flight loadNewWord() call applying its (now
    // stale) result after a later call has already started/finished —
    // e.g. double-clicking Next or holding Enter.
    const requestIdRef = useRef(0)

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
        const requestId = ++requestIdRef.current
        setIsLoading(true)
        let word: JapaneseWord | null = null
        let nextOptions: string[] | null = null

        try {
            if (gameType === "words") {
                word = await getRandomWord(mode, filter, lang)
            } else if (gameType === "guess") {
                // For guess mode (multiple choice), we want single characters
                word = await getRandomCharacter(mode, {
                    ...filter,
                    minLength: 1,
                    maxLength: 1,
                })
            } else {
                // For character shuffle/practice mode, use the actual filter lengths
                word = await getRandomCharacter(mode, filter)
            }

            // Generate distractors for guess mode
            if (word && gameType === "guess") {
                const distractors: string[] = []
                // Try to get 2 unique distractors
                for (let i = 0; i < 10 && distractors.length < 2; i++) {
                    const dist = await getRandomCharacter(mode, {
                        ...filter,
                        minLength: 1,
                        maxLength: 1,
                    })
                    if (dist && dist.romaji !== word.romaji && !distractors.includes(dist.romaji)) {
                        distractors.push(dist.romaji)
                    }
                }

                // Fallback distractors if we couldn't get unique ones from the pool
                const fallbacks = ["a", "i", "u", "e", "o", "ka", "ki", "ku", "ke", "ko"]
                while (distractors.length < 2) {
                    const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)]!
                    if (fallback !== word.romaji && !distractors.includes(fallback)) {
                        distractors.push(fallback)
                    }
                }

                nextOptions = shuffleArray([word.romaji, ...distractors])
            }
        } catch (error: any) {
            console.error("Failed to load word:", error)
        } finally {
            if (requestId === requestIdRef.current) setIsLoading(false)
        }

        // A newer loadNewWord() call has already superseded this one —
        // discard this (stale) result instead of overwriting newer state.
        if (requestId !== requestIdRef.current) return

        if (word) {
            setCurrentWord(word)
            setDisplayRomaji(word.romaji)
            setNoWordsAvailable(false)
            setOptions(nextOptions)
        } else {
            setCurrentWord(null)
            setDisplayRomaji("")
            setNoWordsAvailable(true)
            setOptions(null)
        }

        if (word) {
            setUserInput("")
            setFeedback(null)
            setErrorDetails(null)

            requestAnimationFrame(() => {
                if (!suppressFocus) inputRef.current?.focus()
            })
        }
    }, [mode, filter, suppressFocus, lang, gameType, disableNext, setFeedback])



    const checkAnswer = useCallback(async (value?: string | React.MouseEvent) => {
        const answerToTest = (typeof value === "string" ? value : userInput).trim()
        if (!currentWord || !answerToTest) return

        let isCorrect = validateAnswer(answerToTest, currentWord)
        let detectionResult: ErrorDetectionResult | null = null

        
        if (!isCorrect && gameType !== "guess") {
            try {
                detectionResult = await detectErrors(currentWord.kana, answerToTest)
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

            if (gameType === "guess") {
                // No complex error detection for multiple choice
                return
            }
            
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
                
                
                
                detectErrors(currentWord.kana, answerToTest).then(handleDetectionResult)
            }
        }
    }, [currentWord, userInput, submitAnswer, startTransition, gameType])

    
    const skipWord = useCallback(() => {
        skipQuestion()
        if (currentWord) setDisplayRomaji(currentWord.romaji)
    }, [currentWord, skipQuestion])

    
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            if (feedback) {
                if (!disableNext && !isLoading) loadNewWord()
            } else if (gameType !== "guess") {
                checkAnswer()
            }
        }
    }, [feedback, disableNext, isLoading, loadNewWord, checkAnswer, gameType])

    
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
        options,

        
        accuracyPercent,

        
        checkAnswer,
        skipWord,
        handleKeyDown,
        loadNewWord,
    }
}
