import { useCallback, useReducer } from "react"
import type { TranslationKey } from "@/lib/i18n"
import { createSession, sessionReducer, type PlayMode, type SessionOutcomeEvent } from "@/lib/core/game-session"

export type { PlayMode } from "@/lib/core/game-session"

type SessionProgressOptions = {
    defaultTargetCount?: number
    basePoints?: number
    t?: (key: TranslationKey) => string
}

export function useSessionProgress({ defaultTargetCount = 10, basePoints = 10, t }: SessionProgressOptions = {}) {
    const [state, dispatch] = useReducer(sessionReducer, { targetCount: defaultTargetCount, basePoints }, createSession)
    const { answeredCount, correctCount, skippedCount, playMode, targetCount } = state
    const handleSessionEvent = useCallback((event: SessionOutcomeEvent) => dispatch(event), [])
    const resetSession = useCallback((playMode?: PlayMode, targetCount?: number) => {
        dispatch({ type: "session-restarted", playMode, targetCount })
    }, [])
    const setPlayMode = useCallback((playMode: PlayMode) => dispatch({ type: "mode-changed", playMode }), [])
    const setTargetCount = useCallback((targetCount: number) => dispatch({ type: "target-changed", targetCount }), [])
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0
    const submittedCount = answeredCount - skippedCount
    const answerAccuracy = submittedCount > 0 ? Math.round((correctCount / submittedCount) * 100) : 100
    const remainingQuestions = playMode === "session" ? Math.max(targetCount - answeredCount, 0) : undefined
    const translate = (key: TranslationKey) => t ? t(key) : key
    const remainingLabel = playMode === "session"
        ? translate("roundsLeft").replace("{count}", String(remainingQuestions))
        : null
    const sessionSummaryProps = {
        title: translate("sessionCompleteTitle"),
        targetLabel: translate("sessionTargetLabel"),
        accuracyLabel: translate("sessionAccuracyLabel"),
        targetCount, accuracy,
        restartLabel: translate("sessionRestart"),
        switchLabel: translate("sessionSwitchToInfinite"),
    }
    return {
        ...state, accuracy, submittedCount, answerAccuracy, remainingQuestions,
        remainingLabel, sessionSummaryProps,
        handleSessionEvent, resetSession, setTargetCount, setPlayMode,
    }
}
