"use client"

import { Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { kanaToRomaji } from "@/lib/japanese-words"
import type { KanjiEntry, KanjiDifficulty } from "@/lib/kanji-data"
import type { Language } from "@/lib/translations"

interface KanjiOptionCardProps {
  kanji: KanjiEntry
  difficulty: KanjiDifficulty
  language: Language
  isSelected: boolean
  isCorrect: boolean | null
  isRevealed: boolean
  onClick: () => void
  disabled: boolean
}

export function KanjiOptionCard({
  kanji,
  difficulty,
  language,
  isSelected,
  isCorrect,
  isRevealed,
  onClick,
  disabled,
}: KanjiOptionCardProps) {
  const showMeaning = difficulty === "easy" || difficulty === "medium"
  const showReading = difficulty === "easy"
  const meaning = kanji.meaning_es && language === "es" ? kanji.meaning_es : kanji.meaning_en
  const usedEnglishMeaning = language === "es" && !kanji.meaning_es && !!kanji.meaning_en
  const romajiReading = kanji.reading ? kanaToRomaji(kanji.reading) : "—"

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:hover:scale-100",
        !isRevealed && !isSelected && "border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50",
        !isRevealed && isSelected && "border-primary bg-primary/10",
        isRevealed && isCorrect === true && "border-green-500 bg-green-500/10",
        isRevealed && isCorrect === false && isSelected && "border-red-500 bg-red-500/10",
        isRevealed && isCorrect === false && !isSelected && "border-border/30 bg-secondary/20 opacity-50",
      )}
    >
      <div className="flex flex-col gap-1">
        {/* Reading as the main label (no kanji character in options) */}
        <span lang="ja" className="text-xl font-medium">{kanji.reading}</span>

        {/* Meaning / reading depending on difficulty */}
        <div className="flex flex-col text-xs text-muted-foreground/80 mt-1 leading-tight gap-0.5">
          {showReading && <span className="uppercase tracking-wide">{romajiReading}</span>}
          {showMeaning && (
            <span className="inline-flex items-center gap-2">
              {meaning ?? "—"}
              {usedEnglishMeaning && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/80 border border-border/50 rounded-full px-2 py-[1px]"
                  title="Meaning shown in English (missing Spanish translation)"
                >
                  <Info className="w-3 h-3" />
                  <span>EN</span>
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
