"use client"

import { useState, useEffect, useCallback } from "react"
import { getRandomKanji, getRandomOptions, loadKanjiByLevels, type KanjiEntry, type KanjiDifficulty } from "@/lib/kanji-data"
import { useGameScore } from "./use-game-score"
import { useKeyboardNavigation } from "./use-keyboard-navigation"

export interface UseKanjiGameProps {
    difficulty: KanjiDifficulty
    onScoreUpdate: (score: number, streak: number, correct: boolean) => void
    disableNext?: boolean
}

export interface UseKanjiGameReturn {
    // State
    currentKanji: KanjiEntry | null
    options: KanjiEntry[]
    selectedOption: KanjiEntry | null
    isRevealed: boolean
    isCorrect: boolean

    // Actions
    handleOptionClick: (option: KanjiEntry) => void
    handleNext: () => void
}

export function useKanjiGame({
    difficulty,
    onScoreUpdate,
    disableNext = false,
}: UseKanjiGameProps): UseKanjiGameReturn {
    const [kanjiSet, setKanjiSet] = useState<KanjiEntry[]>([])
    const [currentKanji, setCurrentKanji] = useState<KanjiEntry | null>(null)
    const [options, setOptions] = useState<KanjiEntry[]>([])
    const [selectedOption, setSelectedOption] = useState<KanjiEntry | null>(null)
    const [isRevealed, setIsRevealed] = useState(false)
    const { updateScore } = useGameScore(onScoreUpdate)

    useEffect(() => {
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
            .then(list => list.filter(k => k.reading)) // Ensure we only use kanji with readings
            .then(list => {
                if (!list.length) throw new Error("No kanji found")
                setKanjiSet(list)
            })
            .catch((err) => {
                console.error("Failed to load kanji:", err)
                setKanjiSet([])
            })
    }, [difficulty])

    const loadNewKanji = useCallback(
        (exclude?: KanjiEntry | null) => {
            if (!kanjiSet.length) return
            const newKanji = getRandomKanji(kanjiSet, exclude ?? undefined)
            setCurrentKanji(newKanji)
            setOptions(getRandomOptions(kanjiSet, newKanji, 3))
            setSelectedOption(null)
            setIsRevealed(false)
        },
        [kanjiSet],
    )

    useEffect(() => {
        if (kanjiSet.length) {
            loadNewKanji()
        }
    }, [kanjiSet, loadNewKanji])

    const handleSubmit = useCallback(
        (option?: KanjiEntry) => {
            const choice = option ?? selectedOption
            if (!choice || !currentKanji) return

            const isCorrect = choice.char === currentKanji.char
            setSelectedOption(choice)
            setIsRevealed(true)
            updateScore(isCorrect)
        },
        [selectedOption, currentKanji, updateScore],
    )

    const handleOptionClick = useCallback((option: KanjiEntry) => {
        if (isRevealed) return
        handleSubmit(option)
    }, [isRevealed, handleSubmit])

    const handleNext = useCallback(() => {
        if (disableNext) return
        loadNewKanji(currentKanji)
    }, [loadNewKanji, currentKanji, disableNext])

    useKeyboardNavigation(
        {
            onEnter: isRevealed && !disableNext ? handleNext : undefined,
        },
        true
    )

    const isCorrect = selectedOption?.char === currentKanji?.char

    return {
        // State
        currentKanji,
        options,
        selectedOption,
        isRevealed,
        isCorrect,

        // Actions
        handleOptionClick,
        handleNext,
    }
}
