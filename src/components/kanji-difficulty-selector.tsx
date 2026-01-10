"use client"

import { useI18n } from "@/lib/i18n"
import type { KanjiDifficulty } from "@/lib/kanji-data"

interface KanjiDifficultySelectorProps {
  difficulty: KanjiDifficulty
  onDifficultyChange: (difficulty: KanjiDifficulty) => void
}

export function KanjiDifficultySelector({ difficulty, onDifficultyChange }: KanjiDifficultySelectorProps) {
  const { t } = useI18n()

  const difficulties: { value: KanjiDifficulty; label: string; hint: string }[] = [
    { value: "easy", label: t("easy"), hint: t("kanjiEasyHint") },
    { value: "medium", label: t("medium"), hint: t("kanjiMediumHint") },
    { value: "hard", label: t("hard"), hint: t("kanjiHardHint") },
  ]

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-widest text-muted-foreground text-center">{t("selectDifficulty")}</p>
      <div className="flex flex-col gap-2">
        {difficulties.map((d) => (
          <button
            key={d.value}
            onClick={() => onDifficultyChange(d.value)}
            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border text-left ${
              difficulty === d.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/50 text-foreground border-border/50 hover:bg-secondary hover:border-primary/30"
            }`}
          >
            <div className="font-semibold">{d.label}</div>
            <div
              className={`text-xs mt-0.5 ${difficulty === d.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}
            >
              {d.hint}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
