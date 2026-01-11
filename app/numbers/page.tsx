"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { NumberGameCard } from "@/components/numbers/number-game-card"
import { DifficultySelector } from "@/components/numbers/difficulty-selector"
import { StatsDisplay } from "@/components/stats-display"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import type { Difficulty } from "@/lib/japanese-numbers"
import { useI18n } from "@/lib/i18n"
import { useSessionProgress } from "@/hooks/use-session-progress"
import { PlayModeControls } from "@/components/session/play-mode-controls"
import { SessionSummaryCard } from "@/components/session/session-summary-card"

export default function NumbersPage() {
    const [difficulty, setDifficulty] = useState<Difficulty>("easy")
    const [sessionId, setSessionId] = useState(() => Math.random().toString(36).slice(2))
    const [numbersMode, setNumbersMode] = useState<"arabicToKanji" | "kanjiToArabic">("arabicToKanji")
    const {
        score,
        streak,
        bestStreak,
        answeredCount,
        correctCount,
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

    const handleScoreUpdate = useMemo(
        () => (newScore: number, newStreak: number, correct: boolean) => {
            handleSessionScoreUpdate(newScore, newStreak, correct)
        },
        [handleSessionScoreUpdate],
    )

    const handleDifficultyChange = (newDifficulty: Difficulty) => {
        setDifficulty(newDifficulty)
        setSessionId(Math.random().toString(36).slice(2))
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
                            {t("numbersTitle")}
                        </h1>
                        <p className="text-muted-foreground text-xs md:text-sm">{t("numbersSubtitle")}</p>
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

                <DifficultySelector difficulty={difficulty} onDifficultyChange={setDifficulty} />

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <Button
                        variant={numbersMode === "arabicToKanji" ? "default" : "outline"}
                        className="w-full justify-center"
                        onClick={() => setNumbersMode("arabicToKanji")}
                    >
                        {t("numbersModeArabicToKanji")}
                    </Button>
                    <Button
                        variant={numbersMode === "kanjiToArabic" ? "default" : "outline"}
                        className="w-full justify-center"
                        onClick={() => setNumbersMode("kanjiToArabic")}
                    >
                        {t("numbersModeKanjiToArabic")}
                    </Button>
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

                <div className="mt-6 mb-6">
                    <NumberGameCard
                        key={`${difficulty}-${numbersMode}-${sessionId}`}
                        difficulty={difficulty}
                        mode={numbersMode}
                        onScoreUpdate={handleScoreUpdate}
                        disableNext={sessionComplete && playMode === "session"}
                    />
                </div>

                <div className="mb-6">
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
