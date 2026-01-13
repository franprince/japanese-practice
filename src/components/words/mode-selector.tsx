"use client"

import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { Settings } from "lucide-react"

import type { GameMode } from "@/types/game"

interface ModeSelectorProps {
  mode: GameMode
  onModeChange: (mode: GameMode) => void
  onCustomClick?: () => void
}

export function ModeSelector({ mode, onModeChange, onCustomClick }: ModeSelectorProps) {
  const { t } = useI18n()
  const modes: { value: GameMode; label: string; japanese: string }[] = [
    { value: "hiragana", label: t("hiraganaLabel"), japanese: "ひらがな" },
    { value: "katakana", label: t("katakanaLabel"), japanese: "カタカナ" },
    { value: "both", label: t("bothLabel"), japanese: "両方" },
  ]

  const handleModeClick = (value: GameMode) => {
    if (value === "custom" && onCustomClick) {
      onCustomClick()
    }
    onModeChange(value)
  }

  return (
    <div className="inline-flex items-center gap-0.5 p-1 rounded-full bg-card/70 border border-border/60">
      {modes.map(({ value, label, japanese }) => (
        <button
          key={value}
          onClick={() => handleModeClick(value)}
          className={cn(
            "relative px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap",
            mode === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="sm:hidden">{label}</span>
          <span className="hidden sm:inline mr-1">{japanese}</span>
          <span className="hidden sm:inline text-[10px] md:text-xs opacity-70">{label}</span>
        </button>
      ))}
      {/* Custom mode button */}
      <button
        onClick={() => handleModeClick("custom")}
        className={cn(
          "relative px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1",
          mode === "custom"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Settings className="h-3 w-3" />
        <span className="hidden sm:inline">{t("custom")}</span>
      </button>
    </div>
  )
}
