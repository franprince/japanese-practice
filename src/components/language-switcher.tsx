"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/core"
import { useLanguage } from "@/lib/i18n"
import type { Language } from "@/lib/i18n"

const languages: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "ja", label: "JA" },
  { code: "es", label: "ES" },
]

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()
  const [mounted, setMounted] = useState(false)

  // Only render after client hydration to avoid mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render placeholder during SSR/hydration
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 p-1 rounded-full bg-secondary/50 border border-border/50",
          className,
        )}
      >
        {languages.map(({ code, label }) => (
          <div
            key={code}
            className="px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground"
          >
            <span>{label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-full bg-secondary/50 border border-border/50 cursor-pointer",
        className,
      )}
    >
      {languages.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
            language === code
              ? "bg-primary text-primary-foreground shadow-lg"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/80",
          )}
        >
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
