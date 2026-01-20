"use client"

import { KanjiOptionCard } from "./kanji-option-card"
import type { KanjiDifficulty } from "@/lib/kanji-data"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check, Info, X } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useKanjiGame } from "@/hooks/use-kanji-game"

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
          <div
            className={`mt-4 p-4 rounded-xl border ${isCorrect ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
              }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isCorrect ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
                <span className={isCorrect ? "text-green-500" : "text-red-500"}>
                  {isCorrect ? t("correct") : t("incorrect")}
                </span>
              </div>
              {levelLabel && (
                <span className="text-[10px] px-2 py-1 rounded-full border border-border/50 text-muted-foreground uppercase tracking-wide">
                  {levelLabel}
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex flex-col gap-1">
              <span className="inline-flex items-center gap-2">
                {meaning ?? t("meaning")}
                {usedEnglishMeaning && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 border border-border/50 rounded-full px-2 py-[2px]"
                    title="Meaning shown in English (missing Spanish translation)"
                  >
                    <Info className="w-3 h-3" />
                    <span>EN</span>
                  </span>
                )}
              </span>
              <span className="uppercase tracking-wide">{currentKanji.reading ? <span lang="ja">{currentKanji.reading}</span> : t("reading")}</span>
            </div>
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
