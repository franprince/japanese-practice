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
        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">01</span>
        <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t("modeLabel")}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {gameModes.map(m => (
          <button key={m.value} onClick={() => onModeChange(m.value)} className={cn(
            "group flex flex-col items-center gap-3 p-4 rounded-3xl border transition-all duration-300",
            mode === m.value ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-[1.02]" : "bg-white/5 border-white/5 hover:border-primary/30 text-muted-foreground hover:text-foreground"
          )}>
            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{m.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">{m.label}</span>
          </button>
        ))}
      </div>
    </section>

    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">02</span>
        <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t("settings.gameType") || "Game Type"}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {gameTypes.map(gt => (
          <button key={gt.value} onClick={() => onGameTypeChange(gt.value as WordsGameType)} className={cn(
            "flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300 text-left",
            gameType === gt.value ? "bg-accent text-accent-foreground border-accent shadow-xl shadow-accent/20" : "bg-white/5 border-white/5 hover:border-accent/30 text-muted-foreground hover:text-foreground"
          )}>
            <div className={cn("p-3 rounded-2xl transition-colors", gameType === gt.value ? "bg-accent-foreground/10" : "bg-white/5")}>
              <gt.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5">{gt.label}</p>
              <p className="text-[9px] opacity-60 font-medium leading-tight">{gt.description}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  </>
}
