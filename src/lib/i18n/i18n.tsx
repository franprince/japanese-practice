"use client"

import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react"
import type { Language, TranslationKey } from "@/lib/i18n/translations"
import en from "@/locales/en.json"
import { useStoredPreference } from "@/hooks/use-stored-preference"

const LANG_STORAGE_KEY = "kana-words-lang"

interface I18nContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey) => string
  isLoading: boolean
}

const I18nContext = createContext<I18nContextValue | null>(null)

const isLanguage = (value: string | null): value is Language => value === "en" || value === "es" || value === "ja"

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

export function I18nProvider({ children, initialLang = "es", translationLoader = loadTranslations }: {
  children: ReactNode
  initialLang?: Language
  translationLoader?: typeof loadTranslations
}) {
  const [lang, setLang] = useStoredPreference(LANG_STORAGE_KEY, initialLang, isLanguage)
  const [loaded, setLoaded] = useState<{ lang: Language; messages: Record<string, string> } | null>(null)
  const translationsMap = lang === "en" ? en : loaded?.lang === lang ? loaded.messages : en
  const isLoading = lang !== "en" && loaded?.lang !== lang

  
  useEffect(() => {
    if (lang === "en") return
    let active = true
    translationLoader(lang)
      .then((trans) => {
        if (active) setLoaded({ lang, messages: trans })
      })
      .catch((err) => {
        if (!active) return
        console.error("Failed to load translations", err)
        setLoaded({ lang, messages: en })
      })
    return () => { active = false }
  }, [lang, translationLoader])

  useEffect(() => { document.documentElement.lang = lang }, [lang])

  const t = useMemo(() => {
    return (key: TranslationKey) => translationsMap[key] || en[key as keyof typeof en] || key
  }, [translationsMap])

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t, isLoading }), [lang, setLang, t, isLoading])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
