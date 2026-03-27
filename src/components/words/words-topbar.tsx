"use client"

import Link from "next/link"
import { 
  ChevronLeft, 
  Settings2, 
  Languages, 
  Search,
  CheckCircle2,
  Circle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/core"
import { useI18n } from "@/lib/i18n"
import { GameMode, WordsGameType } from "@/types/game"

interface WordsTopbarProps {
  mode: GameMode
  playMode: "infinite" | "session"
  targetCount: number
  gameType: WordsGameType
  onOpenSettings: () => void
}

export function WordsTopbar({
  mode,
  playMode,
  targetCount,
  gameType,
  onOpenSettings,
}: WordsTopbarProps) {
  const { t, locale, setLocale } = useI18n()

  const languages = [
    { code: "en", label: "EN" },
    { code: "ja", label: "JA" },
    { code: "es", label: "ES" },
  ]

  const getActiveLabel = () => {
    const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1)
    const typeLabel = gameType.charAt(0).toUpperCase() + gameType.slice(1)
    const countLabel = playMode === "infinite" ? "∞" : targetCount
    return `${modeLabel} • ${typeLabel} • ${countLabel}`
  }

  return (
    <div className="flex items-center justify-between w-full max-w-6xl mx-auto px-4 py-4 md:py-6">
      
      {}
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full bg-background/20 backdrop-blur-md hover:bg-background/40 group px-2 sm:px-4"
          >
            <ChevronLeft className="w-4 h-4 mr-0 sm:mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline font-bold text-xs uppercase tracking-widest">{t("home")}</span>
          </Button>
        </Link>
      </div>

      {}
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-sm sm:text-lg font-black tracking-[0.3em] uppercase opacity-80 decoration-primary decoration-4 underline-offset-8">
          {t("practiceWords") || "Practica de Palabras"}
        </h1>
        <div 
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 hover:border-primary/30 cursor-pointer transition-all hover:scale-105"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">
            {getActiveLabel()}
          </span>
        </div>
      </div>

      {}
      <div className="flex items-center gap-2">
        {}
        <Button
          onClick={onOpenSettings}
          variant="secondary"
          size="sm"
          className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 h-9 sm:h-10 px-3 sm:px-5 font-black uppercase tracking-widest text-[10px]"
        >
          <Settings2 className="w-4 h-4 mr-0 sm:mr-2" />
          <span className="hidden sm:inline">{t("practiceSettings") || "Configure"}</span>
        </Button>

        {}
        <div className="flex items-center p-1 bg-background/20 backdrop-blur-md rounded-full border border-border/20">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLocale(lang.code as "en" | "ja" | "es")}
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[10px] font-bold transition-all",
                locale === lang.code 
                  ? "bg-primary text-primary-foreground shadow-lg" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
