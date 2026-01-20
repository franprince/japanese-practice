"use client"

import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react"
import { translations, type Language, type TranslationKey } from "@/lib/i18n"

const LANG_STORAGE_KEY = "kana-words-lang"

interface I18nContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const getStoredLang = (): Language | null => {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(LANG_STORAGE_KEY)
  if (stored === "en" || stored === "es" || stored === "ja") return stored
  return null
}

export function I18nProvider({ children, initialLang = "es" }: { children: ReactNode; initialLang?: Language }) {
  const [lang, setLangState] = useState<Language>(initialLang)

  useEffect(() => {
    const stored = getStoredLang()
    if (stored) setLangState(stored)
  }, [])

  // Update HTML lang attribute when language changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang
    }
  }, [lang])

  const setLang = (next: Language) => {
    setLangState(next)
    if (typeof window !== "undefined") {
      localStorage.setItem(LANG_STORAGE_KEY, next)
    }
  }

  const t = useMemo(() => {
    return (key: TranslationKey) => translations[lang]?.[key] ?? translations.en[key] ?? key
  }, [lang])

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t }), [lang, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
