"use client"

import { useI18n } from "@/lib/i18n"
import { difficultyRanges, type Difficulty } from "@/lib/japanese/numbers"

interface DifficultySelectorProps {
  difficulty: Difficulty
  onDifficultyChange: (difficulty: Difficulty) => void
}

const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"]
const difficultyEmojis: Record<Difficulty, string> = {
  easy: "🙂",
  medium: "😐",
  hard: "😅",
  expert: "😱",
}

export function DifficultySelector({ difficulty, onDifficultyChange }: DifficultySelectorProps) {
  const { t } = useI18n()

  return (
    <div className="inline-flex flex-nowrap items-center gap-1 rounded-full border border-border/60 bg-card/70 p-1 flex-1 sm:flex-none w-full sm:w-auto">
      {difficulties.map((d) => (
        <button
          key={d}
          onClick={() => onDifficultyChange(d)}
          className={`rounded-full px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap flex-1 basis-0 sm:flex-none sm:basis-auto sm:w-auto text-center ${
            difficulty === d
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="hidden sm:inline">
            {t(d)} <span className="opacity-60">({difficultyRanges[d].label})</span>
          </span>
          <span className="sm:hidden flex items-center gap-1">
            <span>{difficultyEmojis[d]}</span>
            <span className="opacity-80 text-[11px]">{difficultyRanges[d].label}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
