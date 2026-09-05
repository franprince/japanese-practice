/** Language/device selection and browser confirmation policy. */
import type { DatasetLanguage } from "./contracts"

export const normalizeLang = (lang?: string): DatasetLanguage =>
  ["en", "ja"].includes(lang?.toLowerCase() ?? "") ? "en" : "es"
export const isMobileDevice = () => typeof window !== "undefined" && (
  window.matchMedia?.("(max-width: 768px)").matches ||
  /android|iphone|ipad|ipod|mobile|tablet/i.test(navigator.userAgent)
)
export const getWordsetCacheKey = (lang: string) => `prod-${normalizeLang(lang)}`
const confirmationKey = (lang: string) => `wordset-confirmed-${normalizeLang(lang)}`
export function recordConfirmation(lang: string, confirmed: boolean) {
  if (typeof localStorage === "undefined") return
  if (confirmed) localStorage.setItem(confirmationKey(lang), "1")
  else localStorage.removeItem(confirmationKey(lang))
}
