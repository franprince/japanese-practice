import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useMobileDevice } from "./use-mobile-device"
import type { Language } from "@/lib/i18n"
import type { WordsGameType } from "@/types/game"
import {
    ConsentRequired, isMobileDevice, normalizeLang, wordsetAcquisition, fetchWordsetMetadata,
    type WordsetAcquisition,
} from "@/lib/japanese/wordsets"

const idleStates = {
    en: { lang: "en", status: "idle" },
    es: { lang: "es", status: "idle" },
} as const

export const useMobileWordset = (lang: Language, acquisition: WordsetAcquisition = wordsetAcquisition, preferredType: WordsGameType | null = null) => {
    const datasetLang = normalizeLang(lang)
    const mobile = useMobileDevice()
    const [selectedType, setSelectedType] = useState<WordsGameType | null>(null)
    const [modal, setModal] = useState({ lang: datasetLang, open: false, dismissed: false })
    const [size, setSize] = useState<{ lang: string; mb: number } | null>(null)
    const active = useRef<AbortController | null>(null)
    const selected = useRef<WordsGameType | null>(null)
    const subscribe = useCallback((notify: () => void) => acquisition.subscribe(next => {
        if (next.lang === datasetLang) notify()
    }), [acquisition, datasetLang])
    const snapshot = useCallback(() => acquisition.state(datasetLang), [acquisition, datasetLang])
    // The server never acquires a dataset. Its stable snapshot must stay idle.
    const serverState = idleStates[datasetLang]
    const serverSnapshot = useCallback(() => serverState, [serverState])
    const currentState = useSyncExternalStore(subscribe, snapshot, serverSnapshot)

    useEffect(() => {
        if (mobile !== true) return
        const controller = new AbortController()
        active.current = controller
        acquisition.acquire(datasetLang, { signal: controller.signal, verifyCache: true }).catch(error => {
            if (controller.signal.aborted) return
            if (!(error instanceof ConsentRequired)) console.warn("Wordset cache check failed", error)
            if ((selected.current ?? preferredType) === "words") setModal({ lang: datasetLang, open: true, dismissed: false })
        })
        return () => { controller.abort(); active.current?.abort() }
    }, [acquisition, datasetLang, mobile, preferredType])

    useEffect(() => {
        const controller = new AbortController()
        fetchWordsetMetadata(fetch, datasetLang, controller.signal)
            .then(metadata => {
                if (!controller.signal.aborted) {
                    setSize({ lang: datasetLang, mb: Math.round(metadata.bytes / 1024 / 1024 * 10) / 10 })
                }
            }).catch(error => {
                if (!controller.signal.aborted) console.warn("Wordset size unavailable; using estimate", error)
            })
        return () => controller.abort()
    }, [datasetLang])

    const requestWords = useCallback(async (consent: boolean) => {
        active.current?.abort()
        const controller = new AbortController()
        active.current = controller
        setModal({ lang: datasetLang, open: true, dismissed: false })
        try {
            await acquisition.acquire(datasetLang, { consent, signal: controller.signal, verifyCache: true })
            if (controller.signal.aborted) return
            setModal({ lang: datasetLang, open: false, dismissed: false })
        } catch (error) {
            if (controller.signal.aborted) return
            if (!(error instanceof ConsentRequired)) console.warn("Wordset acquisition failed", error)
        }
    }, [acquisition, datasetLang])

    const setGameType = useCallback((type: WordsGameType) => {
        selected.current = type
        setSelectedType(type)
        if (type === "words" && isMobileDevice()) { void requestWords(false); return }
        active.current?.abort()
        setModal({ lang: datasetLang, open: false, dismissed: true })
    }, [requestWords, datasetLang])
    const confirmWordMode = useCallback(() => {
        selected.current = "words"
        setSelectedType("words")
        return requestWords(true)
    }, [requestWords])
    const cancelConfirm = useCallback(() => {
        active.current?.abort()
        selected.current = "characters"
        setSelectedType("characters")
        setModal({ lang: datasetLang, open: false, dismissed: true })
    }, [datasetLang])

    const isMobile = mobile === true
    const gameType = selectedType ?? preferredType ?? (mobile === false ? "words" : "characters")
    const mobileConfirmOpen = modal.lang === datasetLang && modal.open
    const dismissed = modal.lang === datasetLang && modal.dismissed
    const busy = !dismissed && ["checking-cache", "downloading", "persisting"].includes(currentState.status)
    const downloadProgress = !dismissed && currentState.status === "downloading" && currentState.total
        ? Math.min(99, Math.floor(currentState.received / currentState.total * 100))
        : !dismissed && currentState.status === "persisting" ? 99 : null
    return {
        gameType: mobile !== false && gameType === "words" && currentState.status !== "ready" ? "characters" as const : gameType,
        isMobile, mobileConfirmOpen, downloadProgress, busy,
        downloadError: !dismissed && currentState.status === "failed" ? currentState.error.messageKey : null,
        persisting: currentState.status === "persisting",
        wordsetSizeMB: size?.lang === datasetLang ? size.mb : datasetLang === "es" ? 5 : 33,
        setGameType, confirmWordMode, cancelConfirm,
    }
}
export type MobileWordsetState = ReturnType<typeof useMobileWordset>
