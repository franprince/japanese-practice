"use client"

import { useI18n } from "@/lib/i18n"
import type { KanjiDifficulty } from "@/lib/japanese/kanji"

interface KanjiDifficultySelectorProps {
  difficulty: KanjiDifficulty
  onDifficultyChange: (difficulty: KanjiDifficulty) => void
}

const difficulties: { value: KanjiDifficulty; level: string }[] = [
  { value: "easy", level: "N5" },
  { value: "medium", level: "N5–N3" },
  { value: "hard", level: "N5–N1" },
]

export function KanjiDifficultySelector({ difficulty, onDifficultyChange }: KanjiDifficultySelectorProps) {
  const { t } = useI18n()

  return (
    <div className="inline-flex items-center gap-0.5 p-1 rounded-full bg-card/70 border border-border/60">
      {difficulties.map((d) => (
        <button
          key={d.value}
          onClick={() => onDifficultyChange(d.value)}
          className={`rounded-full px-2 md:px-3 py-1 md:py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
            difficulty === d.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t(d.value)}
          <span className="ml-1 opacity-60">({d.level})</span>
        </button>
      ))}
    </div>
  )
}
