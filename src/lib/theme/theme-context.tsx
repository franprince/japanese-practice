"use client"

import React, { createContext, useContext, useEffect, type ReactNode } from "react"
import { useStoredPreference } from "@/hooks/use-stored-preference"


import type { Theme } from "@/types/ui"


export type { Theme } from "@/types/ui"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
const isTheme = (value: string | null): value is Theme => value !== null &&
  ["default", "sakura", "ocean", "forest", "sunset", "daylight", "lavender", "mint"].includes(value)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useStoredPreference<Theme>("theme", "default", isTheme)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
