import { useCallback, useMemo, useState } from "react"
import type { TranslationKey } from "@/lib/translations"

export type PlayMode = "infinite" | "session"

type SessionProgressOptions = {
    defaultTargetCount?: number
    /** Translator function (i18n) for building UI labels */
    t?: (key: TranslationKey) => string
}

export function useSessionProgress({ defaultTargetCount = 10, t }: SessionProgressOptions = {}) {
    const [score, setScore] = useState(0)
    const [streak, setStreak] = useState(0)
    const [bestStreak, setBestStreak] = useState(0)
    const [answeredCount, setAnsweredCount] = useState(0)
    const [correctCount, setCorrectCount] = useState(0)
    const [sessionId, setSessionId] = useState(0)
    const [playMode, setPlayMode] = useState<PlayMode>("session")
    const [targetCount, setTargetCount] = useState<number>(defaultTargetCount)
    const [sessionComplete, setSessionComplete] = useState(false)

    const handleScoreUpdate = useCallback(
        (newScore: number, newStreak: number, correct: boolean) => {
            setScore(newScore)
            setStreak(newStreak)
            setBestStreak((prev) => (newStreak > prev ? newStreak : prev))

            setAnsweredCount((prev) => {
                const next = prev + 1
                if (playMode === "session" && next >= targetCount) {
                    setSessionComplete(true)
                }
                return next
            })

            if (correct) {
                setCorrectCount((prev) => prev + 1)
            }
        },
        [playMode, targetCount],
    )

    const resetSession = useCallback(
        (mode?: PlayMode) => {
            setSessionId((prev) => prev + 1)
            setScore(0)
            setStreak(0)
            setBestStreak(0)
            setAnsweredCount(0)
            setCorrectCount(0)
            setSessionComplete(false)
            if (mode) setPlayMode(mode)
        },
        [],
    )

    const accuracy = useMemo(
        () => (answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0),
        [answeredCount, correctCount],
    )

    const remainingQuestions = useMemo(
        () => (playMode === "session" ? Math.max(targetCount - answeredCount, 0) : undefined),
        [playMode, targetCount, answeredCount],
    )

    const translate = useCallback(
        (key: TranslationKey) => (t ? t(key) : key),
        [t],
    )

    const remainingLabel = playMode === "session"
        ? translate("roundsLeft").replace("{count}", String(Math.max(remainingQuestions ?? 0, 0)))
        : null

    const sessionSummaryProps = {
        title: translate("sessionCompleteTitle"),
        targetLabel: translate("sessionTargetLabel"),
        correctLabel: translate("sessionCorrectLabel"),
        accuracyLabel: translate("sessionAccuracyLabel"),
        targetCount,
        correctCount,
        accuracy,
        restartLabel: translate("sessionRestart"),
        switchLabel: translate("sessionSwitchToInfinite"),
    }

    return {
        score,
        streak,
        bestStreak,
        answeredCount,
        correctCount,
        sessionId,
        playMode,
        targetCount,
        sessionComplete,
        accuracy,
        remainingQuestions,
        remainingLabel,
        sessionSummaryProps,
        handleScoreUpdate,
        resetSession,
        setTargetCount,
        setPlayMode,
        setSessionComplete,
        setScore,
        setStreak,
        setBestStreak,
    }
}
