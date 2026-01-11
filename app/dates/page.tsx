"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { DateGameCard } from "@/components/dates/date-game-card"
import { DateModeSelector } from "@/components/dates/date-mode-selector"
import { StatsDisplay } from "@/components/stats-display"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import type { DateMode } from "@/lib/japanese-dates"
import { useI18n } from "@/lib/i18n"
import { useSessionProgress } from "@/hooks/use-session-progress"
import { PlayModeControls } from "@/components/session/play-mode-controls"
import { SessionSummaryCard } from "@/components/session/session-summary-card"

export default function DatesPage() {
    const [mode, setMode] = useState<DateMode>("days")
    const [key, setKey] = useState(0)
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
    } = useSessionProgress()
    const { t } = useI18n()

    const handleScoreUpdate = useCallback(
        (newScore: number, newStreak: number, correct: boolean) => {
            handleSessionScoreUpdate(newScore, newStreak, correct)
        },
        [handleSessionScoreUpdate],
    )

    const handleModeChange = (newMode: DateMode) => {
        setMode(newMode)
        setKey((prev) => prev + 1)
        resetSession()
    }

    return (
        <main className="min-h-screen bg-background relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className="container max-w-2xl mx-auto px-4 py-6 md:py-10 relative">
                <header className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <Button asChild variant="ghost" size="sm" className="shrink-0 cursor-pointer -ml-3">
                            <Link href="/">← Home</Link>
                        </Button>
                        <LanguageSwitcher />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-balance bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
                            {t("datesTitle")}
                        </h1>
                        <p className="text-muted-foreground text-xs md:text-sm">{t("datesSubtitle")}</p>
                    </div>
                </header>

                <PlayModeControls
                    playMode={playMode}
                    onSelectMode={(mode) => resetSession(mode)}
                    isSession={playMode === "session"}
                    targetCount={targetCount}
                    onSelectCount={(count) => {
                        setTargetCount(count)
                        resetSession()
                    }}
                    remainingQuestions={remainingQuestions}
                    infiniteLabel={t("playModeInfinite")}
                    sessionLabel={t("playModeSession")}
                    questionsLabel={t("questionsLabel")}
                    questionsLeftLabel={t("questionsLeft")}
                />

                {sessionComplete && playMode === "session" && (
                    <div className="mb-6 mt-4">
                        <SessionSummaryCard
                            title={t("sessionCompleteTitle")}
                            targetLabel={t("sessionTargetLabel")}
                            correctLabel={t("sessionCorrectLabel")}
                            accuracyLabel={t("sessionAccuracyLabel")}
                            targetCount={targetCount}
                            correctCount={correctCount}
                            accuracy={accuracy}
                            onRestart={() => resetSession()}
                            onSwitchToInfinite={() => resetSession("infinite")}
                            restartLabel={t("sessionRestart")}
                            switchLabel={t("sessionSwitchToInfinite")}
                        />
                    </div>
                )}

                <div className="mb-6">
                    <DateGameCard key={`${key}-${sessionId}`} mode={mode} onScoreUpdate={handleScoreUpdate} />
                </div>

                <div className="mb-6">
                    <StatsDisplay score={score} streak={streak} bestStreak={bestStreak} />
                </div>

                <div className="space-y-4">
                    <DateModeSelector mode={mode} onModeChange={handleModeChange} />
                </div>

                <footer className="mt-10 text-center">
                    <p className="text-xs text-muted-foreground/60">
                        {t("pressEnter")}{" "}
                        <kbd className="px-2 py-1 bg-secondary/50 rounded-md text-[10px] font-mono border border-border/50">
                            Enter
                        </kbd>{" "}
                        {t("toSubmit")}
                    </p>
                </footer>
            </div>
        </main>
    )
}
