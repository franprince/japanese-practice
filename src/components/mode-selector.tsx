"use client"

import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"

import type { GameMode } from "@/types/game"

interface ModeSelectorProps {
  mode: GameMode
  onModeChange: (mode: GameMode) => void
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const { t } = useI18n()
  const modes: { value: GameMode; label: string; japanese: string }[] = [
    { value: "hiragana", label: t("hiraganaLabel"), japanese: "ひらがな" },
    { value: "katakana", label: t("katakanaLabel"), japanese: "カタカナ" },
    { value: "both", label: t("bothLabel"), japanese: "両方" },
  ]

  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-secondary/50 border border-border/50">
        {modes.map(({ value, label, japanese }) => (
          <button
            key={value}
            onClick={() => onModeChange(value)}
            className={cn(
              "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
              mode === value
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="mr-1.5">{japanese}</span>
            <span className="text-xs opacity-70">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
