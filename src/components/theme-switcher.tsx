"use client"

import { useTheme } from "@/lib/theme-context"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()

  const themes = [
    { value: "default", label: "Default", description: "Clean dark theme" },
    { value: "sakura", label: "Sakura", description: "Pink cherry blossom" },
    { value: "ocean", label: "Ocean", description: "Deep blue waves" },
    { value: "forest", label: "Forest", description: "Green bamboo" },
    { value: "sunset", label: "Sunset", description: "Warm orange glow" },
  ] as const

  const currentTheme = themes.find(t => t.value === theme)

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-white/70 hover:text-white hover:bg-white/10"
      >
        <span>{currentTheme?.label}</span>
        <ChevronDown className="w-4 h-4" />
      </Button>
      
      <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg overflow-hidden">
          {themes.map((themeOption) => (
            <button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className="w-full px-3 py-2 text-left hover:bg-accent/20 transition-colors border-b border-border/20 last:border-b-0"
            >
              <div className="text-sm font-medium text-foreground">
                {themeOption.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {themeOption.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
