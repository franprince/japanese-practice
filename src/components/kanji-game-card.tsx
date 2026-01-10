"use client"

import { useState, useEffect, useCallback } from "react"
import { KanjiOptionCard } from "./kanji-option-card"
import { getRandomKanji, getRandomOptions, type Kanji, type KanjiDifficulty } from "@/lib/kanji-data"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check, X } from "lucide-react"
import { useI18n } from "@/lib/i18n"

interface KanjiGameCardProps {
  difficulty: KanjiDifficulty
  onScoreUpdate: (score: number, streak: number, correct: boolean) => void
}

export function KanjiGameCard({ difficulty, onScoreUpdate }: KanjiGameCardProps) {
  const { t, lang } = useI18n()
  const [currentKanji, setCurrentKanji] = useState<Kanji | null>(null)
  const [options, setOptions] = useState<Kanji[]>([])
  const [selectedOption, setSelectedOption] = useState<Kanji | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)

  const loadNewKanji = useCallback(() => {
    const newKanji = getRandomKanji(currentKanji ?? undefined)
    setCurrentKanji(newKanji)
    setOptions(getRandomOptions(newKanji, 3))
    setSelectedOption(null)
    setIsRevealed(false)
  }, [currentKanji])

  useEffect(() => {
    loadNewKanji()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOptionClick = (option: Kanji) => {
    if (isRevealed) return
    setSelectedOption(option)
  }

  const handleSubmit = useCallback(() => {
    if (!selectedOption || !currentKanji) return

    const isCorrect = selectedOption.kanji === currentKanji.kanji
    setIsRevealed(true)

    if (isCorrect) {
      const streakBonus = Math.floor(streak / 5) * 5
      const newScore = score + 10 + streakBonus
      const newStreak = streak + 1
      setScore(newScore)
      setStreak(newStreak)
      onScoreUpdate(newScore, newStreak, true)
    } else {
      setStreak(0)
      onScoreUpdate(score, 0, false)
    }
  }, [selectedOption, currentKanji, score, streak, onScoreUpdate])

  const handleNext = useCallback(() => {
    loadNewKanji()
  }, [loadNewKanji])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (isRevealed) {
          handleNext()
        } else if (selectedOption) {
          handleSubmit()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isRevealed, selectedOption]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentKanji) return null

  const isCorrect = selectedOption?.kanji === currentKanji.kanji

  return (
    <div className="space-y-6">
      {/* Kanji Display */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">{t("whatIsReading")}</p>

        <div className="text-7xl md:text-9xl font-bold mb-4 relative">{currentKanji.kanji}</div>

        {/* Result feedback */}
        {isRevealed && (
          <div
            className={`mt-4 p-4 rounded-xl border ${
              isCorrect ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              {isCorrect ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
              <span className={isCorrect ? "text-green-500" : "text-red-500"}>
                {isCorrect ? t("correct") : t("incorrect")}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{currentKanji.reading}</span>
              <span className="mx-2">•</span>
              <span className="font-mono">{currentKanji.romaji}</span>
              <span className="mx-2">•</span>
              <span>{currentKanji.meaning[lang]}</span>
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {options.map((option) => (
          <KanjiOptionCard
            key={option.kanji}
            kanji={option}
            difficulty={difficulty}
            language={lang}
            isSelected={selectedOption?.kanji === option.kanji}
            isCorrect={isRevealed ? option.kanji === currentKanji.kanji : null}
            isRevealed={isRevealed}
            onClick={() => handleOptionClick(option)}
            disabled={isRevealed}
          />
        ))}
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        {isRevealed ? (
          <Button onClick={handleNext} size="lg" className="gap-2">
            {t("nextKanji")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!selectedOption} size="lg" className="gap-2">
            {t("check")}
          </Button>
        )}
      </div>
    </div>
  )
}
