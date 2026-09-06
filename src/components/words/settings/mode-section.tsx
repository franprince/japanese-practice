"use client"

import * as React from "react"
import { Dice5, Shuffle, Type } from "lucide-react"
import { cn } from "@/lib/core"
import { useI18n } from "@/lib/i18n"
import type { GameMode, WordsGameType } from "@/types/game"

interface ModeSectionProps {
  mode: GameMode
  gameType: WordsGameType
  onModeChange: (mode: GameMode) => void
  onGameTypeChange: (gameType: WordsGameType) => void
}

export function ModeSection({ mode, gameType, onModeChange, onGameTypeChange }: ModeSectionProps) {
  const { t } = useI18n()
  const gameModes: { value: GameMode; label: string; icon: string }[] = [
    { value: "hiragana", label: t("hiraganaLabel"), icon: "あ" },
    { value: "katakana", label: t("katakanaLabel"), icon: "ア" },
    { value: "both", label: t("bothLabel"), icon: "あア" },
    { value: "custom", label: t("custom"), icon: "⚙️" },
  ]
  const gameTypes = [
    { value: "words", label: t("modeWords"), icon: Type, description: t("games.words.description") || "Vocabulary practice" },
    { value: "characters", label: t("modeCharacters"), icon: Shuffle, description: t("games.characters.description") || "Random characters" },
    { value: "guess", label: t("modeGuess"), icon: Dice5, description: t("games.guess.description") || "Multiple choice" },
  ]

  return <>
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">{t("practice.subject")}</h3>
      </div>
      <div role="group" aria-label={t("practice.subject")} className="grid grid-cols-2 gap-3">
        {gameModes.map(m => (
          <button key={m.value} onClick={() => onModeChange(m.value)} aria-pressed={mode === m.value} className={cn(
            "group flex min-h-11 items-center justify-center gap-2 p-3 rounded-xl border transition-colors duration-300",
            mode === m.value ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border hover:border-primary/30 text-muted-foreground hover:text-foreground"
          )}>
            <span className="text-xl">{m.icon}</span>
            <span className="text-sm font-medium">{m.label}</span>
          </button>
        ))}
      </div>
    </section>

    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">{t("practice.format")}</h3>
      </div>
      <div role="group" aria-label={t("practice.format")} className="grid grid-cols-1 gap-3">
        {gameTypes.map(gt => (
          <button key={gt.value} onClick={() => onGameTypeChange(gt.value as WordsGameType)} aria-pressed={gameType === gt.value} className={cn(
            "flex min-h-11 items-center gap-4 p-3 rounded-xl border transition-colors duration-300 text-left",
            gameType === gt.value ? "bg-accent text-accent-foreground border-accent" : "bg-secondary border-border hover:border-accent/30 text-muted-foreground hover:text-foreground"
          )}>
            <div className={cn("p-2 rounded-xl transition-colors", gameType === gt.value ? "bg-accent-foreground/10" : "bg-secondary")}>
              <gt.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium mb-0.5">{gt.label}</p>
              <p className="text-sm opacity-60 font-medium leading-tight">{gt.description}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  </>
}
