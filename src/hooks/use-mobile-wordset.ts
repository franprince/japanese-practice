import { useCallback, useEffect, useState } from "react"
import type { Language } from "@/lib/i18n"
import { normalizeLang, primeWordsetCache, readWordsetCache } from "@/lib/japanese/words"

const isMobileDevice = () => {
  if (typeof window === "undefined") return false
  if (window.matchMedia?.("(max-width: 768px)").matches) return true
  const ua = navigator.userAgent.toLowerCase()
  return /android|iphone|ipad|ipod|mobile|tablet/.test(ua)
}

const WORDSET_SIZE_MB_BY_LANG: Record<"en" | "es" | "ja", number> = {
  en: 33,
  es: 5,
  ja: 33,
}

export type MobileWordsetState = {
  isCharacterMode: boolean
  isMobile: boolean
  mobileConfirmOpen: boolean
  downloadProgress: number | null
  wordsetSizeMB: number
  requestToggleCharacterMode: () => void
  confirmWordMode: () => Promise<void>
  cancelConfirm: () => void
}

export const useMobileWordset = (lang: Language): MobileWordsetState => {
  const [isCharacterMode, setIsCharacterMode] = useState(false)
  const [mobileConfirmOpen, setMobileConfirmOpen] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [wordsetSizeMB, setWordsetSizeMB] = useState<number>(WORDSET_SIZE_MB_BY_LANG[lang])
  const [wordsetSizeBytes, setWordsetSizeBytes] = useState<number | null>(null)
  const [confirmedWordLang, setConfirmedWordLang] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isCheckingCache, setIsCheckingCache] = useState(false)

  useEffect(() => {
    const mobile = isMobileDevice()
    setIsMobile(mobile)
    if (mobile) {
      setIsCharacterMode(true)
    }
  }, [])

  useEffect(() => {
    if (!isMobileDevice()) return
    const datasetLang = normalizeLang(lang)
    setIsCheckingCache(true)
    readWordsetCache(datasetLang)
      .then((cached) => {
        if (cached) {
          setConfirmedWordLang(datasetLang)
        } else if (!isCharacterMode && confirmedWordLang && confirmedWordLang !== datasetLang) {
          setIsCharacterMode(true)
          setMobileConfirmOpen(true)
        }
      })
      .finally(() => setIsCheckingCache(false))
      .catch(() => undefined)
  }, [lang, isCharacterMode, confirmedWordLang])

  useEffect(() => {
    const datasetLang = normalizeLang(lang)
    const fallback = WORDSET_SIZE_MB_BY_LANG[lang] ?? WORDSET_SIZE_MB_BY_LANG.es
    setWordsetSizeMB(fallback)
    const controller = new AbortController()

    const fetchSize = async () => {
      try {
        const res = await fetch(`/api/wordset?lang=${datasetLang}`, {
          method: "HEAD",
          signal: controller.signal,
        })
        const sizeHeader = res.headers.get("content-length")
        if (!sizeHeader) return
        const bytes = Number(sizeHeader)
        if (!Number.isFinite(bytes) || bytes <= 0) return
        setWordsetSizeBytes(bytes)
        const mb = Math.round((bytes / 1024 / 1024) * 10) / 10
        setWordsetSizeMB(mb)
      } catch {
        // keep fallback
      }
    }

    fetchSize()
    return () => controller.abort()
  }, [lang])

  const requestToggleCharacterMode = useCallback(() => {
    if (isCharacterMode && isMobileDevice()) {
      const datasetLang = normalizeLang(lang)
      if (confirmedWordLang !== datasetLang) {
        setMobileConfirmOpen(true)
        return
      }
    }
    setIsCharacterMode((prev) => !prev)
  }, [isCharacterMode, confirmedWordLang, lang])

  const confirmWordMode = useCallback(async () => {
    const datasetLang = normalizeLang(lang)
    setDownloadProgress(0)
    try {
      const res = await fetch(`/api/wordset?lang=${datasetLang}`)
      const contentLength = Number(res.headers.get("content-length") || 0)
      const totalBytes = contentLength > 0 ? contentLength : (wordsetSizeBytes ?? 0)
      const reader = res.body?.getReader()

      if (reader) {
        const chunks: Uint8Array[] = []
        let received = 0
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) {
            chunks.push(value)
            received += value.length
            if (totalBytes > 0) {
              setDownloadProgress(Math.min(100, Math.round((received / totalBytes) * 100)))
            } else {
              setDownloadProgress((prev) => {
                const next = (prev ?? 0) + 5
                return Math.min(95, next)
              })
            }
          }
        }

        const buffer = new Uint8Array(received)
        let offset = 0
        for (const chunk of chunks) {
          buffer.set(chunk, offset)
          offset += chunk.length
        }
        const text = new TextDecoder().decode(buffer)
        const data = JSON.parse(text)

        await primeWordsetCache(datasetLang, data)
      }
    } catch {
      // allow fallback loading via normal flow
    }
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`wordset-confirmed-${datasetLang}`, "1")
      }
    } catch {
      // ignore storage failures
    }
    setDownloadProgress(100)
    setMobileConfirmOpen(false)
    setConfirmedWordLang(datasetLang)
    setIsCharacterMode(false)
    setDownloadProgress(null)
  }, [lang, wordsetSizeBytes])

  const cancelConfirm = useCallback(() => {
    if (downloadProgress !== null) return
    setMobileConfirmOpen(false)
  }, [downloadProgress])

  const effectiveCharacterMode = isMobile && !isCheckingCache && confirmedWordLang !== normalizeLang(lang)
    ? true
    : isCharacterMode

  return {
    isCharacterMode: effectiveCharacterMode,
    isMobile,
    mobileConfirmOpen,
    downloadProgress,
    wordsetSizeMB,
    requestToggleCharacterMode,
    confirmWordMode,
    cancelConfirm,
  }
}
