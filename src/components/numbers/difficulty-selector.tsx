"use client"

import { useI18n } from "@/lib/i18n"
import { difficultyRanges, type Difficulty } from "@/lib/japanese-numbers"

interface DifficultySelectorProps {
  difficulty: Difficulty
  onDifficultyChange: (difficulty: Difficulty) => void
}

const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"]

export function DifficultySelector({ difficulty, onDifficultyChange }: DifficultySelectorProps) {
  const { t } = useI18n()

  return (
    <div className="inline-flex rounded-full border border-border/60 bg-card/70 p-1">
      {difficulties.map((d) => (
        <button
          key={d}
          onClick={() => onDifficultyChange(d)}
          className={`rounded-full px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
            difficulty === d
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t(d)}
          <span className="ml-1 opacity-60">({difficultyRanges[d].label})</span>
        </button>
      ))}
    </div>
  )
}
