import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { translations, type Language, type TranslationKey } from "@/lib/translations"

interface I18nContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children, initialLang = "en" }: { children: ReactNode; initialLang?: Language }) {
  const [lang, setLang] = useState<Language>(initialLang)

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
