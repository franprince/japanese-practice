"use client"

import { useState, useEffect, useRef, useCallback, useTransition, useMemo, useLayoutEffect } from "react"
import type { JapaneseWord, WordFilter } from "@/lib/japanese/words"
import { loadWordQuestion, evaluateWordAnswer } from "@/lib/japanese/words"
import type { ErrorDetectionResult } from "@/types/japanese"
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

// React owns the local round and admits results; domain helpers only return data.
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
    const [pending, setPending] = useState(false)
    const filterKey = JSON.stringify({ ...filter, selectedGroups: [...filter.selectedGroups].sort() })
    const stableFilter = useMemo<WordFilter>(() => JSON.parse(filterKey), [filterKey])
    const configKey = JSON.stringify([mode, gameType, lang, sessionId, filterKey])
    const [loaded, setLoaded] = useState<{ configKey: string; sessionId: number; questionId: number } | null>(null)
    const isLoading = pending || !loaded || (!disableNext && loaded.configKey !== configKey)
    const generation = useRef<string | null>(configKey)
    useLayoutEffect(() => {
        generation.current = configKey
        return () => { generation.current = null }
    }, [configKey])
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
        submitAnswer,
        skipQuestion
    } = useBaseGame({ sessionId, questionId: loaded?.questionId ?? 0, onSessionEvent, disabled: disableNext || isLoading })

    

    
    const generateWord = useCallback(async () => {
        if (generation.current !== configKey) return
        const requestId = ++requestIdRef.current
        validationRequestRef.current = null
        const question = await loadWordQuestion({
            mode, gameType, filter: stableFilter, lang,
        })
        const { word, options: nextOptions } = question
        if ("error" in question) console.error("Failed to load word:", question.error)

        // A newer loadNewWord() call has already superseded this one —
        // discard this (stale) result instead of overwriting newer state.
        if (requestId !== requestIdRef.current || generation.current !== configKey) return
        setPending(false)
        setLoaded({ configKey, sessionId, questionId: requestId })
        if (diagnosticsSessionRef.current !== sessionId) {
            diagnosticsSessionRef.current = sessionId
            setIncorrectChars(new Map())
        }
        setUserInput("")
        setErrorDetails(null)

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

    }, [mode, stableFilter, lang, gameType, sessionId, configKey])

    const loadNewWord = useCallback(async () => {
        if (disableNext || generation.current !== configKey) return
        setPending(true)
        await generateWord()
    }, [disableNext, configKey, generateWord])

    const checkAnswer = useCallback(async (value?: string | React.MouseEvent) => {
        const answerToTest = (typeof value === "string" ? value : userInput).trim()
        if (!currentWord || !answerToTest || feedback !== null || disableNext || isLoading) return
        const requestId = requestIdRef.current
        if (validationRequestRef.current === requestId) return
        validationRequestRef.current = requestId

        const evaluation = evaluateWordAnswer(currentWord, answerToTest, gameType)
        const outcome = evaluation instanceof Promise ? await evaluation : evaluation
        const { isCorrect, errorDetails: detectionResult, diagnosticError } = outcome
        if ("diagnosticError" in outcome) console.error("Validation error:", diagnosticError)

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
        if (suppressFocus || isLoading || disableNext) return
        const frame = requestAnimationFrame(() => inputRef.current?.focus())
        return () => cancelAnimationFrame(frame)
    }, [suppressFocus, isLoading, disableNext, currentWord])

    
    const visibleIncorrectChars = useMemo(() => loaded?.sessionId === sessionId ? incorrectChars : new Map<string, { count: number; romaji: string }>(), [loaded?.sessionId, sessionId, incorrectChars])
    useEffect(() => {
        onIncorrectCharsChange?.(visibleIncorrectChars)
    }, [visibleIncorrectChars, onIncorrectCharsChange])

    return {
        
        currentWord,
        userInput: loaded?.sessionId === sessionId ? userInput : "",
        setUserInput,
        feedback,
        noWordsAvailable,
        isLoading,
        displayRomaji,
        errorDetails: loaded?.sessionId === sessionId ? errorDetails : null,
        incorrectChars: visibleIncorrectChars,
        inputRef,
        options,

        

        
        checkAnswer,
        skipWord,
        handleKeyDown,
        loadNewWord,
    }
}
