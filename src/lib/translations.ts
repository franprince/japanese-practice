import en from "@/locales/en.json"

export type Language = "en" | "es" | "ja"

export type TranslationKey = keyof typeof en

// Removed monolithic object to reduce bundle size.
// Translations are now loaded dynamically in i18n.tsx
