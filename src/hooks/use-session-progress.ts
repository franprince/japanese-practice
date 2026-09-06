import { useMistakeReview } from "./use-mistake-review"
import { useCallback, useReducer } from "react"
import type { TranslationKey } from "@/lib/i18n"
import { createSession, sessionReducer, type PlayMode, type SessionOutcomeEvent } from "@/lib/core/game-session"

export type { PlayMode } from "@/lib/core/game-session"

type SessionProgressOptions<Question> = {
    defaultPlayMode?: PlayMode
    questionKey?: (question: Question) => string
    defaultTargetCount?: number
    basePoints?: number
    t?: (key: TranslationKey) => string
}

export function useSessionProgress<Question = never>({ defaultTargetCount = 10, defaultPlayMode = "session", basePoints = 10, t, questionKey }: SessionProgressOptions<Question> = {}) {
    const [state, dispatch] = useReducer(sessionReducer, { targetCount: defaultTargetCount, playMode: defaultPlayMode, basePoints }, createSession)
    const { answeredCount, correctCount, skippedCount, playMode, targetCount } = state
    const handleSessionEvent = useCallback((event: SessionOutcomeEvent) => dispatch(event), [])
    const review = useMistakeReview<Question>(state.sessionId, questionKey)
    const { clearReview } = review
    const originalTarget = review.review?.originalTarget
    const resetSession = useCallback((playMode?: PlayMode, targetCount?: number) => {
        clearReview()
        dispatch({ type: "session-restarted", playMode, targetCount: targetCount ?? originalTarget })
    }, [clearReview, originalTarget])
    const setPlayMode = useCallback((playMode: PlayMode) => resetSession(playMode), [resetSession])
    const setTargetCount = useCallback((targetCount: number) => resetSession(undefined, targetCount), [resetSession])
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0
    const submittedCount = answeredCount - skippedCount
    const answerAccuracy = submittedCount > 0 ? Math.round((correctCount / submittedCount) * 100) : 100
    const remainingQuestions = playMode === "session" ? Math.max(targetCount - answeredCount, 0) : undefined
    const translate = (key: TranslationKey) => t ? t(key) : key
    const remainingLabel = playMode === "session"
        ? translate("roundsLeft").replace("{count}", String(remainingQuestions))
        : null
    const startReview = () => {
        const questions = review.beginReview()
        if (!questions) return
        review.setReview({ questions, originalTarget: review.review?.originalTarget ?? targetCount })
        dispatch({ type: "session-restarted", playMode: "session", targetCount: questions.length })
    }
    const sessionSummaryProps = {
        missedCount: review.missedQuestions.length,
        onReview: startReview,
        title: translate("sessionCompleteTitle"),
        targetLabel: translate("sessionTargetLabel"),
        accuracyLabel: translate("sessionAccuracyLabel"),
        targetCount, accuracy,
        restartLabel: translate("sessionRestart"),
        switchLabel: translate("sessionSwitchToInfinite"),
    }
    return {
        ...state, reviewQuestions: review.review?.questions, onQuestionMissed: playMode === "session" ? review.onQuestionMissed : undefined, reviewing: !!review.review, settingsTargetCount: review.review?.originalTarget ?? targetCount, accuracy, submittedCount, answerAccuracy, remainingQuestions,
        remainingLabel, sessionSummaryProps,
        handleSessionEvent, resetSession, setTargetCount, setPlayMode,
    }
}
