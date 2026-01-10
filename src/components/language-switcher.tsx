"use client"

import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import type { Language } from "@/lib/translations"

const languages: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "EN", flag: "🇺🇸" },
  { code: "ja", label: "JA", flag: "🇯🇵" },
  { code: "es", label: "ES", flag: "🇪🇸" },
]

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-full bg-secondary/50 border border-border/50 cursor-pointer",
        className,
      )}
    >
      {languages.map(({ code, label, flag }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
            language === code
              ? "bg-primary text-primary-foreground shadow-lg"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/80",
          )}
        >
          <span>{flag}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
