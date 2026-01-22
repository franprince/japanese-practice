"use client"

import { KanjiOptionCard } from "./kanji-option-card"
import type { KanjiDifficulty } from "@/lib/japanese/kanji"
import { Button } from "@/components/ui/button"
import { ArrowRight, Info } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useKanjiGame } from "@/hooks/use-kanji-game"
import { ResultDisplay } from "@/components/game/primitives"

interface KanjiGameCardProps {
  difficulty: KanjiDifficulty
  onScoreUpdate: (score: number, streak: number, correct: boolean) => void
  disableNext?: boolean
}

export function KanjiGameCard({ difficulty, onScoreUpdate, disableNext = false }: KanjiGameCardProps) {
  const { t, lang } = useI18n()
  const {
    currentKanji,
    options,
    selectedOption,
    isRevealed,
    isCorrect,
    handleOptionClick,
    handleNext,
  } = useKanjiGame({ difficulty, onScoreUpdate, disableNext })

  if (!currentKanji) return null

  const meaning = lang === "es" ? currentKanji.meaning_es ?? currentKanji.meaning_en : currentKanji.meaning_en ?? currentKanji.meaning_es
  const usedEnglishMeaning = lang === "es" && !currentKanji.meaning_es && !!currentKanji.meaning_en
  const levelLabel = currentKanji.jlpt ? currentKanji.jlpt.toUpperCase().replace("JLPT-", "JLPT ") : null
  const promptLabel = t("kanji")

  return (
    <div className="space-y-6">
      {/* Kanji Display */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">{promptLabel}</p>

        <div lang="ja" className="text-7xl md:text-9xl font-bold mb-4 relative">{currentKanji.char}</div>

        {/* Result feedback */}
        {isRevealed && (
          <div className="mt-4">
            <ResultDisplay
              isCorrect={isCorrect}
              expectedAnswer={meaning ?? t("meaning")}
              userAnswer={selectedOption ? (lang === "es" ? selectedOption.meaning_es ?? selectedOption.meaning_en : selectedOption.meaning_en ?? selectedOption.meaning_es) ?? "" : ""}
              romaji={currentKanji.reading ?? t("reading")}
              t={t}
              additionalInfo={
                <div className="flex items-center justify-between">
                  {usedEnglishMeaning && (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 border border-border/50 rounded-full px-2 py-[2px]"
                      title="Meaning shown in English (missing Spanish translation)"
                    >
                      <Info className="w-3 h-3" />
                      <span>EN</span>
                    </span>
                  )}
                  {levelLabel && (
                    <span className="text-[10px] px-2 py-1 rounded-full border border-border/50 text-muted-foreground uppercase tracking-wide ml-auto">
                      {levelLabel}
                    </span>
                  )}
                </div>
              }
            />
          </div>
        )}
      </div>

      {/* Options */}
      <div id="kanji-options" className="grid grid-cols-1 gap-3">
        {options.map((option) => (
          <KanjiOptionCard
            key={option.char}
            kanji={option}
            difficulty={difficulty}
            language={lang}
            isSelected={selectedOption?.char === option.char}
            isCorrect={isRevealed ? option.char === currentKanji.char : null}
            isRevealed={isRevealed}
            onClick={() => handleOptionClick(option)}
            disabled={isRevealed}
          />
        ))}
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        {isRevealed && (
          <Button onClick={handleNext} size="lg" className="gap-2" disabled={disableNext}>
            {t("nextKanji")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
