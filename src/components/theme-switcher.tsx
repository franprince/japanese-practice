"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "@/lib/theme-context"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const themes = [
    { value: "default", label: "Default", description: "Clean dark theme" },
    { value: "sakura", label: "Sakura", description: "Pink cherry blossom" },
    { value: "ocean", label: "Ocean", description: "Deep blue waves" },
    { value: "forest", label: "Forest", description: "Green bamboo" },
    { value: "sunset", label: "Sunset", description: "Warm orange glow" },
  ] as const

  const currentTheme = themes.find(t => t.value === theme)

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
        className="gap-2 text-white/70 hover:text-white hover:bg-white/10"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span>{currentTheme?.label}</span>
        <ChevronDown className="w-4 h-4" />
      </Button>
      
      {open && (
        <div className="absolute top-full mt-1 z-50 w-56 max-w-[calc(100vw-1.5rem)] left-0 sm:left-auto sm:right-0">
          <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg overflow-hidden max-h-[70vh] overflow-y-auto">
            {themes.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => {
                  setTheme(themeOption.value)
                  setOpen(false)
                }}
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
      )}
    </div>
  )
}
