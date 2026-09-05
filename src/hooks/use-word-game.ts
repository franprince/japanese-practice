"use client"

import { useState, useEffect, useRef, useCallback, useTransition } from "react"
import type { JapaneseWord, WordFilter } from "@/lib/japanese/words"
import { getRandomWord, getRandomCharacter } from "@/lib/japanese/words"
import { validateAnswer } from "@/lib/japanese/shared/input"
import { detectErrors, type ErrorDetectionResult } from "@/lib/japanese/shared/error-detection"
import { shuffleArray } from "@/lib/core/random"
import type { GameMode, WordsGameType } from "@/types/game"
import type { GameSessionProps } from "@/lib/core/game-session"
import type { Language } from "@/lib/i18n/translations"
import { useBaseGame } from "./use-base-game"

export interface UseWordGameProps extends GameSessionProps {
    mode: GameMode
    filter: WordFilter
    gameType: WordsGameType
    disableNext: boolean
    suppressFocus: boolean
    lang: Language
    onIncorrectCharsChange?: (chars: Map<string, { count: number; romaji: string }>) => void
}

export interface UseWordGameReturn {
    
    currentWord: JapaneseWord | null
    userInput: string
    setUserInput: (value: string) => void
    feedback: "correct" | "incorrect" | null
    noWordsAvailable: boolean
    isLoading: boolean
    displayRomaji: string
    errorDetails: ErrorDetectionResult | null
    incorrectChars: Map<string, { count: number; romaji: string }>
    inputRef: React.RefObject<HTMLInputElement | null>
    options: string[] | null

    

    
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
    sessionId,
    onSessionEvent,
    onIncorrectCharsChange,
}: UseWordGameProps): UseWordGameReturn {
    
    const [currentWord, setCurrentWord] = useState<JapaneseWord | null>(null)
    const [userInput, setUserInput] = useState("")
    const [options, setOptions] = useState<string[] | null>(null)
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
    const validationRequestRef = useRef<number | null>(null)
    const diagnosticsSessionRef = useRef(sessionId)

    const {
        feedback,
        beginQuestion,
        submitAnswer,
        skipQuestion
    } = useBaseGame({ sessionId, onSessionEvent, disabled: disableNext })

    

    
    const generateWord = useCallback(async () => {
        const requestId = ++requestIdRef.current
        setIsLoading(true)
        validationRequestRef.current = null
        if (diagnosticsSessionRef.current !== sessionId) {
            diagnosticsSessionRef.current = sessionId
            setIncorrectChars(new Map())
            setErrorDetails(null)
            setUserInput("")
        }
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
            beginQuestion()
            setErrorDetails(null)

            requestAnimationFrame(() => {
                if (!suppressFocus) inputRef.current?.focus()
            })
        }
    }, [mode, filter, suppressFocus, lang, gameType, sessionId, beginQuestion])

    const loadNewWord = useCallback(async () => {
        if (!disableNext) await generateWord()
    }, [disableNext, generateWord])



    const checkAnswer = useCallback(async (value?: string | React.MouseEvent) => {
        const answerToTest = (typeof value === "string" ? value : userInput).trim()
        if (!currentWord || !answerToTest || feedback !== null || disableNext || isLoading) return
        const requestId = requestIdRef.current
        if (validationRequestRef.current === requestId) return
        validationRequestRef.current = requestId

        let isCorrect = validateAnswer(answerToTest, currentWord)
        let detectionResult: ErrorDetectionResult | null = null
        if (!isCorrect && gameType !== "guess") {
            try {
                detectionResult = await detectErrors(currentWord.kana, answerToTest)
                if (detectionResult.isFullyCorrect) isCorrect = true
            } catch (error) {
                console.error("Validation error:", error)
            }
        }

        // A skip, new question, restart or unmount invalidates this result.
        if (requestId !== requestIdRef.current || !submitAnswer(isCorrect)) return
        setDisplayRomaji(currentWord.romaji.toLowerCase().trim())
        if (isCorrect) {
            setErrorDetails(null)
        } else if (detectionResult) {
            const result = detectionResult
            startTransition(() => {
                setErrorDetails(result)
                setIncorrectChars((prev) => {
                    const newMap = new Map(prev)
                    for (const char of result.characters) {
                        if (!char.isCorrect) {
                            const existing = newMap.get(char.kana)
                            newMap.set(char.kana, {
                                count: (existing?.count || 0) + 1,
                                romaji: existing?.romaji || char.expectedRomaji[0] || "",
                            })
                        }
                    }
                    return newMap
                })
            })
        }
    }, [currentWord, userInput, feedback, disableNext, isLoading, submitAnswer, startTransition, gameType])

    const skipWord = useCallback(() => {
        if (!currentWord || isLoading || !skipQuestion()) return
        if (currentWord) setDisplayRomaji(currentWord.romaji)
    }, [currentWord, isLoading, skipQuestion])

    
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
        if (!disableNext) void generateWord()
        return () => { requestIdRef.current += 1 }
    }, [generateWord, disableNext])

    
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
        noWordsAvailable,
        isLoading,
        displayRomaji,
        errorDetails,
        incorrectChars,
        inputRef,
        options,

        

        
        checkAnswer,
        skipWord,
        handleKeyDown,
        loadNewWord,
    }
}
