"use client"
import type { PracticeReviewProps } from "./use-mistake-review"

import { useState, useEffect, useCallback, useRef } from "react"
import { getRandomKanji, getRandomOptions, loadKanjiByLevels, type KanjiEntry, type KanjiDifficulty } from "@/lib/japanese/kanji"
import { useBaseGame } from "./use-base-game"
import type { GameSessionProps } from "@/lib/core/game-session"
import { useKeyboardNavigation } from "./use-keyboard-navigation"

export interface UseKanjiGameProps extends GameSessionProps, PracticeReviewProps<KanjiEntry> {
    difficulty: KanjiDifficulty
    disableNext?: boolean
}

export interface UseKanjiGameReturn {
    
    error: boolean
    retry: () => void
    currentKanji: KanjiEntry | null
    options: KanjiEntry[]
    selectedOption: KanjiEntry | null
    isRevealed: boolean
    isCorrect: boolean

    
    handleOptionClick: (option: KanjiEntry) => void
    handleNext: () => void
}

export function useKanjiGame({
    difficulty,
    sessionId,
    onSessionEvent,
    disableNext = false,
    reviewQuestions,
    onQuestionMissed,
}: UseKanjiGameProps): UseKanjiGameReturn {
    const [failed, setFailed] = useState(false)
    const [attempt, setAttempt] = useState(0)
    const retry = () => { setFailed(false); setAttempt(value => value + 1) }
    const [kanjiPool, setKanjiPool] = useState<{ difficulty: KanjiDifficulty; entries: KanjiEntry[] } | null>(null)
    const kanjiSet = kanjiPool?.difficulty === difficulty ? kanjiPool.entries : null
    const [loaded, setLoaded] = useState<{ sessionId: number; difficulty: KanjiDifficulty; id: number } | null>(null)
    const request = useRef(0)
    const reviewIndex = useRef(0)
    const ready = loaded?.sessionId === sessionId && loaded.difficulty === difficulty
    const [currentKanji, setCurrentKanji] = useState<KanjiEntry | null>(null)
    const [options, setOptions] = useState<KanjiEntry[]>([])
    const [selectedOption, setSelectedOption] = useState<KanjiEntry | null>(null)

    
    const {
        feedback,
        isCurrentQuestion,
        submitAnswer
    } = useBaseGame({ sessionId, questionId: loaded?.id ?? 0, onSessionEvent, disabled: disableNext || !ready })

    const isRevealed = ready && feedback !== null
    const isCorrect = feedback === "correct"

    useEffect(() => {
        if (disableNext) return
        const id = ++request.current
        let active = true
        let levels: string[] = []
        switch (difficulty) {
            case "easy":
                levels = ["n5"]
                break
            case "medium":
                levels = ["n5", "n4", "n3"]
                break
            case "hard":
                levels = ["n5", "n4", "n3", "n2", "n1"]
                break
        }

        loadKanjiByLevels(levels)
            .then(list => list.filter(k => k.reading)) 
            .then(list => {
                if (!active) return
                if (!list.length) throw new Error("No kanji found")
                reviewIndex.current = 0
                const nextKanji = reviewQuestions?.[0] ?? getRandomKanji(list)
                setFailed(false)
                setKanjiPool({ difficulty, entries: list })
                setCurrentKanji(nextKanji)
                setOptions(getRandomOptions(list, nextKanji, 3))
                setSelectedOption(null)
                setLoaded({ sessionId, difficulty, id })
            })
            .catch((err) => {
                if (!active) return
                console.error("Failed to load kanji:", err)
                setFailed(true)
                setKanjiPool(null)
            })
        return () => { active = false }
    }, [difficulty, sessionId, disableNext, reviewQuestions, attempt])

    const loadNewKanji = useCallback(
        (exclude?: KanjiEntry | null) => {
            if (!kanjiSet?.length || !isCurrentQuestion()) return
            reviewIndex.current += 1
            const newKanji = reviewQuestions?.length ? reviewQuestions[reviewIndex.current % reviewQuestions.length]! : getRandomKanji(kanjiSet, exclude ?? undefined)
            setCurrentKanji(newKanji)
            setOptions(getRandomOptions(kanjiSet, newKanji, 3))
            setSelectedOption(null)
            setLoaded({ sessionId, difficulty, id: ++request.current })
        },
        [kanjiSet, isCurrentQuestion, sessionId, difficulty, reviewQuestions],
    )

    const handleSubmit = useCallback(
        (option?: KanjiEntry) => {
            const choice = option ?? selectedOption
            if (!choice || !currentKanji || disableNext) return

            const correct = choice.char === currentKanji.char
            if (submitAnswer(correct)) {
                setSelectedOption(choice)
                if (!correct) onQuestionMissed?.(currentKanji)
            }
        },
        [selectedOption, currentKanji, disableNext, submitAnswer, onQuestionMissed],
    )

    const handleOptionClick = useCallback((option: KanjiEntry) => {
        if (isRevealed || disableNext || !kanjiSet?.length) return
        handleSubmit(option)
    }, [isRevealed, disableNext, kanjiSet, handleSubmit])

    const handleNext = useCallback(() => {
        if (disableNext) return
        loadNewKanji(currentKanji)
    }, [loadNewKanji, currentKanji, disableNext])

    useKeyboardNavigation(
        {
            onEnter: isRevealed && !disableNext ? handleNext : undefined,
        },
        !disableNext
    )

    return {
        
        error: failed, retry,
        currentKanji: ready && kanjiSet?.length ? currentKanji : null,
        options,
        selectedOption: ready ? selectedOption : null,
        isRevealed,
        isCorrect,

        
        handleOptionClick,
        handleNext,
    }
}
