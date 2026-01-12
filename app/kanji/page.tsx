"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { KanjiGameCard } from "@/components/kanji/kanji-game-card"
import { KanjiDifficultySelector } from "@/components/kanji/kanji-difficulty-selector"
import { StatsDisplay } from "@/components/stats-display"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import type { KanjiDifficulty } from "@/lib/kanji-data"
import { useI18n } from "@/lib/i18n"
import { useSessionProgress } from "@/hooks/use-session-progress"
import { GameSettingsPopover } from "@/components/session/game-settings-popover"
import { SessionSummaryCard } from "@/components/session/session-summary-card"

export default function KanjiPage() {
    const [difficulty, setDifficulty] = useState<KanjiDifficulty>("easy")
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

    const handleDifficultyChange = (newDifficulty: KanjiDifficulty) => {
        setDifficulty(newDifficulty)
        setKey((prev) => prev + 1)
        resetSession()
    }

    const remainingLabel =
        playMode === "session" ? `${Math.max(remainingQuestions ?? 0, 0)} rounds left` : null

    return (
        <main className="min-h-screen bg-background relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className="container max-w-2xl mx-auto px-4 py-6 md:py-10 relative">
                <header className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <Button asChild variant="ghost" size="sm" className="shrink-0 cursor-pointer -ml-3">
                            <Link href="/">← Home</Link>
                        </Button>
                        <LanguageSwitcher />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-balance bg-linear-to-r from-foreground via-foreground to-primary bg-clip-text">
                            {t("kanjiTitle")}
                        </h1>
                        <p className="text-muted-foreground text-xs md:text-sm">{t("kanjiSubtitle")}</p>
                    </div>
                </header>

                {/* Compact controls row */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
                    <GameSettingsPopover
                        playMode={playMode}
                        onSelectMode={resetSession}
                        targetCount={targetCount}
                        onSelectCount={(count) => {
                            setTargetCount(count)
                            resetSession()
                        }}
                        remainingQuestions={remainingQuestions ?? 0}
                    />
                    <KanjiDifficultySelector difficulty={difficulty} onDifficultyChange={handleDifficultyChange} />
                </div>

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
                    <KanjiGameCard
                        key={`${key}-${sessionId}`}
                        difficulty={difficulty}
                        onScoreUpdate={handleScoreUpdate}
                        disableNext={sessionComplete && playMode === "session"}
                    />
                </div>

                <div className="mb-6">
                    {remainingLabel && (
                        <div className="flex justify-center mb-2">
                            <div className="text-xs font-medium text-foreground px-3 py-1 rounded-full bg-secondary/70 border border-border/60">
                                {remainingLabel}
                            </div>
                        </div>
                    )}
                    <StatsDisplay score={score} streak={streak} bestStreak={bestStreak} />
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
