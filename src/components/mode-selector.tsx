"use client"

import { cn } from "@/lib/utils"

type GameMode = "hiragana" | "katakana" | "both"

interface ModeSelectorProps {
  mode: GameMode
  onModeChange: (mode: GameMode) => void
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const modes: { value: GameMode; label: string; japanese: string }[] = [
    { value: "hiragana", label: "Hiragana", japanese: "ひらがな" },
    { value: "katakana", label: "Katakana", japanese: "カタカナ" },
    { value: "both", label: "Both", japanese: "両方" },
  ]

  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-secondary/50 border border-border/50">
        {modes.map(({ value, label, japanese }) => (
          <button
            key={value}
            onClick={() => onModeChange(value)}
            className={cn(
              "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
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
