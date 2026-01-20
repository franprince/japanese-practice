"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "@/lib/theme"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { ChevronDown, Moon, Sun } from "lucide-react"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const darkThemes = [
    { value: "default", label: "Default", description: "Clean dark theme" },
    { value: "sakura", label: "Sakura", description: "Pink cherry blossom" },
    { value: "ocean", label: "Ocean", description: "Deep blue waves" },
    { value: "forest", label: "Forest", description: "Green bamboo" },
    { value: "sunset", label: "Sunset", description: "Warm orange glow" },
  ] as const

  const lightThemes = [
    { value: "daylight", label: "Daylight", description: "Clean modern light" },
    { value: "lavender", label: "Lavender", description: "Soft purple tones" },
    { value: "mint", label: "Mint", description: "Fresh green vibes" },
  ] as const

  const allThemes = [...darkThemes, ...lightThemes]
  const currentTheme = allThemes.find(t => t.value === theme)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-foreground/70 hover:text-foreground hover:bg-accent/10"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span>{currentTheme?.label}</span>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {open && (
        <div className="absolute top-full mt-1 z-50 w-64 max-w-[calc(100vw-1.5rem)] left-0 sm:left-auto sm:right-0">
          <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg overflow-hidden max-h-[70vh] overflow-y-auto">
            {/* Dark Themes Section */}
            <div className="px-3 py-2 border-b border-border/30">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Moon className="w-3.5 h-3.5" />
                <span>Dark Themes</span>
              </div>
            </div>
            {darkThemes.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => {
                  setTheme(themeOption.value)
                  setOpen(false)
                }}
                className="w-full px-3 py-2.5 text-left hover:bg-accent/20 transition-colors border-b border-border/10 last:border-b-0"
              >
                <div className="text-sm font-medium text-foreground">
                  {themeOption.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {themeOption.description}
                </div>
              </button>
            ))}

            {/* Light Themes Section */}
            <div className="px-3 py-2 border-b border-border/30 mt-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Sun className="w-3.5 h-3.5" />
                <span>Light Themes</span>
              </div>
            </div>
            {lightThemes.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => {
                  setTheme(themeOption.value)
                  setOpen(false)
                }}
                className="w-full px-3 py-2.5 text-left hover:bg-accent/20 transition-colors border-b border-border/10 last:border-b-0"
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
      )}
    </div>
  )
}
