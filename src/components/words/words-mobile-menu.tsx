"use client"

import { Settings2, Trophy, Flame, Type, Shuffle, Dice5 } from "lucide-react"
import { cn } from "@/lib/core"
import { useI18n } from "@/lib/i18n"
import type { WordsGameType } from "@/types/game"

interface WordsMobileMenuProps {
  score: number
  streak: number
  mode: string
  gameType: WordsGameType
  onOpenSettings: () => void
}

export function WordsMobileMenu({ score, streak, mode, gameType, onOpenSettings }: WordsMobileMenuProps) {
  const { t } = useI18n()

  const modeIcons: Record<string, string> = {
    hiragana: "あ",
    katakana: "ア",
    both: "あア",
    custom: "⚙️"
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[50] flex items-center gap-2 px-3 py-2 bg-card/80 backdrop-blur-2xl border border-primary/20 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-in slide-in-from-bottom duration-700 md:hidden">
      {/* Current Mode & Type Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black text-primary leading-none">{modeIcons[mode] || "あ"}</span>
          <div className="w-[1px] h-3 bg-primary/20" />
          {gameType === "words" && <Type className="w-3 h-3 text-primary/60" />}
          {gameType === "characters" && <Shuffle className="w-3 h-3 text-primary/60" />}
          {gameType === "guess" && <Dice5 className="w-3 h-3 text-primary/60" />}
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider text-primary/60 hidden xs:block">
          {(t as any)(mode + "Label") || mode}
        </span>
      </div>

      {/* Stats Divider */}
      <div className="w-[1px] h-6 bg-border/20 mx-1" />

      {/* Stats Group */}
      <div className="flex items-center gap-4 px-2">
        <div className="flex items-center gap-1.5 group">
          <Trophy className="w-3.5 h-3.5 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
          <span className="text-sm font-black tabular-nums">{score}</span>
        </div>
        
        <div className="flex items-center gap-1.5 group">
          <Flame className={cn(
            "w-3.5 h-3.5 transition-opacity",
            streak > 0 ? "text-accent opacity-100 animate-pulse" : "text-muted-foreground opacity-40"
          )} />
          <span className={cn(
            "text-sm font-black tabular-nums",
            streak === 0 && "text-muted-foreground/40"
          )}>{streak}</span>
        </div>
      </div>

      {/* Settings Trigger */}
      <button
        onClick={onOpenSettings}
        className="ml-2 p-2.5 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        aria-label={t("commandCenter") || "Open Command Center"}
      >
        <Settings2 className="w-4 h-4" />
      </button>
    </div>
  )
}
