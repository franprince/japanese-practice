"use client"

import { useState, useEffect, useCallback } from "react"
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
    const [currentKanji, setCurrentKanji] = useState<KanjiEntry | null>(null)
    const [options, setOptions] = useState<KanjiEntry[]>([])
    const [selectedOption, setSelectedOption] = useState<KanjiEntry | null>(null)

    
    const {
        feedback,
        beginQuestion,
        submitAnswer
    } = useBaseGame({ sessionId, onSessionEvent, disabled: disableNext })

    const isRevealed = feedback !== null
    const isCorrect = feedback === "correct"

    useEffect(() => {
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
                setKanjiPool({ difficulty, entries: list })
            })
            .catch((err) => {
                if (!active) return
                console.error("Failed to load kanji:", err)
                setKanjiPool(null)
            })
        return () => { active = false }
    }, [difficulty])

    const loadNewKanji = useCallback(
        (exclude?: KanjiEntry | null) => {
            if (!kanjiSet?.length) return
            const newKanji = getRandomKanji(kanjiSet, exclude ?? undefined)
            setCurrentKanji(newKanji)
            setOptions(getRandomOptions(kanjiSet, newKanji, 3))
            setSelectedOption(null)
            beginQuestion()
        },
        [kanjiSet, beginQuestion],
    )

    useEffect(() => {
        if (kanjiSet?.length) {
            loadNewKanji()
        }
    }, [kanjiSet, loadNewKanji])

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
        
        currentKanji: kanjiSet?.length ? currentKanji : null,
        options,
        selectedOption,
        isRevealed,
        isCorrect,

        
        handleOptionClick,
        handleNext,
    }
}
