"use client"

import { useI18n } from "@/lib/i18n"
import type { Language } from "@/lib/i18n"

export function useLanguage() {
  const { lang, setLang } = useI18n()
  return {
    language: lang as Language,
    setLanguage: (next: Language) => setLang(next),
  }
}
