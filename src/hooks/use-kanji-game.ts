"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getRandomKanji, getRandomOptions, loadKanjiByLevels, type KanjiEntry, type KanjiDifficulty } from "@/lib/japanese/kanji"
import { useBaseGame } from "./use-base-game"
import type { GameSessionProps } from "@/lib/core/game-session"
import { useKeyboardNavigation } from "./use-keyboard-navigation"

export interface UseKanjiGameProps extends GameSessionProps {
    difficulty: KanjiDifficulty
    disableNext?: boolean
}

export interface UseKanjiGameReturn {
    
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
}: UseKanjiGameProps): UseKanjiGameReturn {
    const [kanjiPool, setKanjiPool] = useState<{ difficulty: KanjiDifficulty; entries: KanjiEntry[] } | null>(null)
    const kanjiSet = kanjiPool?.difficulty === difficulty ? kanjiPool.entries : null
    const [loaded, setLoaded] = useState<{ sessionId: number; difficulty: KanjiDifficulty; id: number } | null>(null)
    const request = useRef(0)
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
                const nextKanji = getRandomKanji(list)
                setKanjiPool({ difficulty, entries: list })
                setCurrentKanji(nextKanji)
                setOptions(getRandomOptions(list, nextKanji, 3))
                setSelectedOption(null)
                setLoaded({ sessionId, difficulty, id })
            })
            .catch((err) => {
                if (!active) return
                console.error("Failed to load kanji:", err)
                setKanjiPool(null)
            })
        return () => { active = false }
    }, [difficulty, sessionId, disableNext])

    const loadNewKanji = useCallback(
        (exclude?: KanjiEntry | null) => {
            if (!kanjiSet?.length || !isCurrentQuestion()) return
            const newKanji = getRandomKanji(kanjiSet, exclude ?? undefined)
            setCurrentKanji(newKanji)
            setOptions(getRandomOptions(kanjiSet, newKanji, 3))
            setSelectedOption(null)
            setLoaded({ sessionId, difficulty, id: ++request.current })
        },
        [kanjiSet, isCurrentQuestion, sessionId, difficulty],
    )

    const handleSubmit = useCallback(
        (option?: KanjiEntry) => {
            const choice = option ?? selectedOption
            if (!choice || !currentKanji || disableNext) return

            const correct = choice.char === currentKanji.char
            if (submitAnswer(correct)) setSelectedOption(choice)
        },
        [selectedOption, currentKanji, disableNext, submitAnswer],
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
        
        currentKanji: ready && kanjiSet?.length ? currentKanji : null,
        options,
        selectedOption: ready ? selectedOption : null,
        isRevealed,
        isCorrect,

        
        handleOptionClick,
        handleNext,
    }
}
