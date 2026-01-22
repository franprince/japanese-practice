"use client"

import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react"
import type { Language, TranslationKey } from "@/lib/i18n/translations"
import en from "@/locales/en.json"

const LANG_STORAGE_KEY = "kana-words-lang"

interface I18nContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey) => string
  isLoading: boolean
}

const I18nContext = createContext<I18nContextValue | null>(null)

const getStoredLang = (): Language | null => {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(LANG_STORAGE_KEY)
  if (stored === "en" || stored === "es" || stored === "ja") return stored as Language
  return null
}

const loadTranslations = async (lang: Language): Promise<Record<string, string>> => {
  switch (lang) {
    case "es":
      return (await import("@/locales/es.json")).default
    case "ja":
      return (await import("@/locales/ja.json")).default
    case "en":
    default:
      return en
  }
}

export function I18nProvider({ children, initialLang = "es" }: { children: ReactNode; initialLang?: Language }) {
  // Read from storage immediately to avoid hydration mismatch
  const getInitialLang = (): Language => {
    if (typeof window === "undefined") return initialLang
    const stored = getStoredLang()
    return stored || initialLang
  }

  const [lang, setLangState] = useState<Language>(getInitialLang)
  const [translationsMap, setTranslationsMap] = useState<Record<string, string>>(en) // Default to English initially
  const [isLoading, setIsLoading] = useState(false)

  // Load translations when lang changes
  useEffect(() => {
    if (lang === "en") {
      setTranslationsMap(en)
      setIsLoading(false)
      document.documentElement.lang = "en"
      return
    }

    setIsLoading(true)
    loadTranslations(lang)
      .then((trans) => {
        setTranslationsMap(trans)
        document.documentElement.lang = lang
      })
      .catch((err) => {
        console.error("Failed to load translations", err)
        setTranslationsMap(en) // Fallback
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [lang])

  const setLang = (next: Language) => {
    setLangState(next)
    if (typeof window !== "undefined") {
      localStorage.setItem(LANG_STORAGE_KEY, next)
    }
  }

  const t = useMemo(() => {
    return (key: TranslationKey) => translationsMap[key] || en[key as keyof typeof en] || key
  }, [translationsMap])

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t, isLoading }), [lang, t, isLoading])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
