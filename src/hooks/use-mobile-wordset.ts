import { useCallback, useEffect, useRef, useState } from "react"
import type { Language } from "@/lib/i18n"
import type { WordsGameType } from "@/types/game"
import {
    ConsentRequired, isMobileDevice, normalizeLang, wordsetAcquisition,
    type AcquisitionState, type WordsetAcquisition,
} from "@/lib/japanese/words/acquisition"

export const useMobileWordset = (lang: Language, acquisition: WordsetAcquisition = wordsetAcquisition) => {
    const datasetLang = normalizeLang(lang)
    const [gameType, setGameTypeState] = useState<WordsGameType>("words")
    const [isMobile, setIsMobile] = useState(false)
    const [mobileConfirmOpen, setMobileConfirmOpen] = useState(false)
    const [state, setState] = useState<AcquisitionState>({ lang: datasetLang, status: "idle" })
    const [size, setSize] = useState<{ lang: string; mb: number } | null>(null)
    const active = useRef<AbortController | null>(null)
    const selectedType = useRef<WordsGameType>("characters")

    useEffect(() => acquisition.subscribe(next => {
        if (next.lang === datasetLang) setState(next)
    }), [acquisition, datasetLang])

    useEffect(() => {
        const mobile = isMobileDevice()
        setIsMobile(mobile)
        setMobileConfirmOpen(false)
        setState({ lang: datasetLang, status: "checking-cache" })
        if (!mobile) return
        setGameTypeState(selectedType.current === "words" ? "characters" : selectedType.current)
        const controller = new AbortController()
        active.current = controller
        acquisition.acquire(datasetLang, { signal: controller.signal, verifyCache: true }).then(() => {
            if (controller.signal.aborted) return
            setState(acquisition.state(datasetLang))
            if (selectedType.current === "words") setGameTypeState("words")
        }).catch(error => {
            if (controller.signal.aborted) return
            setState(acquisition.state(datasetLang))
            if (!(error instanceof ConsentRequired)) console.warn("Wordset cache check failed", error)
            if (selectedType.current === "words") setMobileConfirmOpen(true)
        })
        return () => { controller.abort(); active.current?.abort() }
    }, [acquisition, datasetLang])

    useEffect(() => {
        const controller = new AbortController()
        fetch(`/api/wordset?lang=${datasetLang}`, { method: "HEAD", signal: controller.signal })
            .then(response => {
                if (!response.ok) throw new Error("Wordset size check failed")
                const bytes = Number(response.headers.get("content-length"))
                if (!controller.signal.aborted && Number.isFinite(bytes) && bytes > 0) {
                    setSize({ lang: datasetLang, mb: Math.round(bytes / 1024 / 1024 * 10) / 10 })
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
        setMobileConfirmOpen(true)
        setGameTypeState("characters")
        try {
            await acquisition.acquire(datasetLang, { consent, signal: controller.signal, verifyCache: true })
            if (controller.signal.aborted) return
            setState(acquisition.state(datasetLang))
            setMobileConfirmOpen(false)
            setGameTypeState("words")
        } catch (error) {
            if (controller.signal.aborted) return
            setState(acquisition.state(datasetLang))
            if (!(error instanceof ConsentRequired)) console.warn("Wordset acquisition failed", error)
        }
    }, [acquisition, datasetLang])

    const setGameType = useCallback((type: WordsGameType) => {
        selectedType.current = type
        if (type === "words" && isMobileDevice()) { void requestWords(false); return }
        active.current?.abort()
        setMobileConfirmOpen(false)
        setGameTypeState(type)
    }, [requestWords])
    const confirmWordMode = useCallback(() => {
        selectedType.current = "words"
        return requestWords(true)
    }, [requestWords])
    const cancelConfirm = useCallback(() => {
        active.current?.abort()
        selectedType.current = "characters"
        setGameTypeState("characters")
        setState({ lang: datasetLang, status: "awaiting-consent" })
        setMobileConfirmOpen(false)
    }, [datasetLang])

    const currentState: AcquisitionState = state.lang === datasetLang ? state : { lang: datasetLang, status: "checking-cache" }
    const busy = ["checking-cache", "downloading", "persisting"].includes(currentState.status)
    const downloadProgress = currentState.status === "downloading" && currentState.total
        ? Math.min(99, Math.floor(currentState.received / currentState.total * 100))
        : currentState.status === "persisting" ? 99 : null
    return {
        gameType: isMobile && gameType === "words" && currentState.status !== "ready" ? "characters" as const : gameType,
        isMobile, mobileConfirmOpen, downloadProgress, busy,
        downloadError: currentState.status === "failed" ? currentState.error.messageKey : null,
        persisting: currentState.status === "persisting",
        wordsetSizeMB: size?.lang === datasetLang ? size.mb : datasetLang === "es" ? 5 : 33,
        setGameType, confirmWordMode, cancelConfirm,
    }
}
export type MobileWordsetState = ReturnType<typeof useMobileWordset>
