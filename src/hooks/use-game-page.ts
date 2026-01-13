import { useCallback, useMemo } from "react"
import { useI18n } from "@/lib/i18n"
import { useSessionProgress } from "./use-session-progress"

/**
 * Consolidated hook for game page logic
 * Combines session progress management with common computed values
 */
export function useGamePage() {
    const { t } = useI18n()
    const sessionProgress = useSessionProgress()

    const {
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
        handleScoreUpdate: handleSessionScoreUpdate,
        resetSession,
        setTargetCount,
        setSessionComplete,
        setBestStreak,
    } = sessionProgress

    /**
     * Memoized score update handler
     */
    const handleScoreUpdate = useCallback(
        (newScore: number, newStreak: number, correct: boolean) => {
            handleSessionScoreUpdate(newScore, newStreak, correct)
        },
        [handleSessionScoreUpdate]
    )

    /**
     * Computed remaining label for session mode
     */
    const remainingLabel = useMemo(() => {
        if (playMode !== "session") return null
        return t("roundsLeft").replace("{count}", String(Math.max(remainingQuestions ?? 0, 0)))
    }, [playMode, remainingQuestions, t])

    /**
     * Props for SessionSummaryCard component
     */
    const sessionSummaryProps = useMemo(
        () => ({
            title: t("sessionCompleteTitle"),
            targetLabel: t("sessionTargetLabel"),
            correctLabel: t("sessionCorrectLabel"),
            accuracyLabel: t("sessionAccuracyLabel"),
            targetCount,
            correctCount,
            accuracy,
            restartLabel: t("sessionRestart"),
            switchLabel: t("sessionSwitchToInfinite"),
        }),
        [t, targetCount, correctCount, accuracy]
    )

    return {
        // Session progress state
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

        // Session progress actions
        resetSession,
        setTargetCount,
        setSessionComplete,
        setBestStreak,

        // Computed values
        handleScoreUpdate,
        remainingLabel,
        sessionSummaryProps,

        // i18n
        t,
    }
}
