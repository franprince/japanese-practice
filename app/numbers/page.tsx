"use client"

import { useMemo, useState } from "react"
import { NumberGameCard } from "@/components/numbers/number-game-card"
import { DifficultySelector } from "@/components/numbers/difficulty-selector"
import { StatsDisplay } from "@/components/game/stats-display"
import { RemainingBadge } from "@/components/game/remaining-badge"
import type { Difficulty } from "@/lib/japanese-numbers"
import { GameSettingsPopover } from "@/components/game/game-settings-popover"
import { SessionSummaryCard } from "@/components/game/session-summary-card"
import { GamePageLayout } from "@/components/layouts/game-page-layout"
import { useGamePage } from "@/hooks/use-game-page"

export default function NumbersPage() {
    const {
        score,
        streak,
        bestStreak,
        playMode,
        targetCount,
        sessionComplete,
        correctCount,
        accuracy,
        handleScoreUpdate: handleSessionScoreUpdate,
        resetSession,
        setTargetCount,
        remainingLabel,
        sessionSummaryProps,
        t,
    } = useGamePage()

    const [difficulty, setDifficulty] = useState<Difficulty>("easy")
    const [sessionId, setSessionId] = useState(() => Math.random().toString(36).slice(2))
    const [numbersMode, setNumbersMode] = useState<"arabicToKanji" | "kanjiToArabic">("arabicToKanji")

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
        <GamePageLayout
            title={t("numbersTitle")}
            subtitle={t("numbersSubtitle")}
            showEnterHint={true}
            controls={
                <>
                    <GameSettingsPopover
                        playMode={playMode}
                        onSelectMode={resetSession}
                        targetCount={targetCount}
                        onSelectCount={(count) => {
                            setTargetCount(count)
                            resetSession()
                        }}
                        remainingQuestions={0}
                    />

                    <DifficultySelector difficulty={difficulty} onDifficultyChange={handleDifficultyChange} />

                    {/* Mode toggle */}
                    <div className="inline-flex rounded-full border border-border/60 bg-card/70 p-1 gap-1 w-full sm:w-auto">
                        <button
                            onClick={() => setNumbersMode("arabicToKanji")}
                            className={`rounded-full px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap w-full sm:w-auto ${numbersMode === "arabicToKanji"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {t("numbersModeArabicToKanji")}
                        </button>
                        <button
                            onClick={() => setNumbersMode("kanjiToArabic")}
                            className={`rounded-full px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap w-full sm:w-auto ${numbersMode === "kanjiToArabic"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {t("numbersModeKanjiToArabic")}
                        </button>
                    </div>
                </>
            }
            stats={
                <>
                    <RemainingBadge label={remainingLabel} />
                    <StatsDisplay score={score} streak={streak} bestStreak={bestStreak} />
                </>
            }
        >
            {sessionComplete && playMode === "session" && (
                <div className="mb-6 mt-4">
                    <SessionSummaryCard
                        {...sessionSummaryProps}
                        onRestart={() => resetSession()}
                        onSwitchToInfinite={() => resetSession("infinite")}
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
        </GamePageLayout>
    )
}
