"use client"

import { useI18n } from "@/lib/i18n"
import { difficultyRanges, type Difficulty } from "@/lib/japanese/numbers"

interface DifficultySelectorProps {
  difficulty: Difficulty
  onDifficultyChange: (difficulty: Difficulty) => void
}

const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"]
export function DifficultySelector({ difficulty, onDifficultyChange }: DifficultySelectorProps) {
  const { t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t("selectDifficulty")}
      className="flex flex-wrap items-center gap-1 rounded-full border border-border/60 bg-card/70 p-1 flex-1 sm:flex-none w-full sm:w-auto"
    >
      {difficulties.map((d) => (
        <button
          key={d}
          onClick={() => onDifficultyChange(d)}
          aria-pressed={difficulty === d}
          className={`min-h-11 rounded-full px-2 py-1 text-sm font-medium transition-colors whitespace-nowrap flex-1 basis-0 sm:flex-none sm:basis-auto sm:w-auto text-center ${
            difficulty === d
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t(d)} <span className="opacity-60">({difficultyRanges[d].label})</span>
        </button>
      ))}
    </div>
  )
}
