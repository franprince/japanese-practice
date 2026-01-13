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
     * Computed remaining label for session mode
     */
    const remainingLabel = playMode === "session"
        ? t("roundsLeft").replace("{count}", String(Math.max(remainingQuestions ?? 0, 0)))
        : null

    /**
     * Props for SessionSummaryCard component
     */
    const sessionSummaryProps = {
        title: t("sessionCompleteTitle"),
        targetLabel: t("sessionTargetLabel"),
        correctLabel: t("sessionCorrectLabel"),
        accuracyLabel: t("sessionAccuracyLabel"),
        targetCount,
        correctCount,
        accuracy,
        restartLabel: t("sessionRestart"),
        switchLabel: t("sessionSwitchToInfinite"),
    }

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
        handleScoreUpdate: handleSessionScoreUpdate,
        remainingLabel,
        sessionSummaryProps,

        // i18n
        t,
    }
}
