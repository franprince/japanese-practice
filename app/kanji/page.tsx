"use client"

import { useState, useEffect } from "react"
import { KanjiGameCard } from "@/components/kanji/kanji-game-card"
import { KanjiDifficultySelector } from "@/components/kanji/kanji-difficulty-selector"
import { StatsDisplay } from "@/components/game/stats-display"
import { RemainingBadge } from "@/components/game/remaining-badge"
import type { KanjiDifficulty } from "@/lib/japanese/kanji"
import { GameSettingsPopover } from "@/components/game/game-settings-popover"
import { SessionSummaryCard } from "@/components/game/session-summary-card"
import { GamePageLayout } from "@/components/layouts/game-page-layout"
import { useSessionProgress } from "@/hooks/use-session-progress"
import { useI18n } from "@/lib/i18n"
import { preloadKanaDictionary } from "@/lib/japanese/shared/kana-dictionary-loader"

export default function KanjiPage() {
    const { t } = useI18n()
    const {
        score,
        streak,
        bestStreak,
        sessionId,
        playMode,
        targetCount,
        sessionComplete,
        correctCount,
        accuracy,
        handleScoreUpdate,
        resetSession,
        setTargetCount,
        remainingLabel,
        sessionSummaryProps,
    } = useSessionProgress({ t })

    const [difficulty, setDifficulty] = useState<KanjiDifficulty>("easy")
    const [key, setKey] = useState(0)

    // Preload kana dictionary for romaji conversion in option cards
    useEffect(() => {
        preloadKanaDictionary()
    }, [])

    const handleDifficultyChange = (newDifficulty: KanjiDifficulty) => {
        setDifficulty(newDifficulty)
        setKey((prev) => prev + 1)
        resetSession()
    }

    return (
        <GamePageLayout
            title={t("kanjiTitle")}
            subtitle={t("kanjiSubtitle")}
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
                    <KanjiDifficultySelector difficulty={difficulty} onDifficultyChange={handleDifficultyChange} />
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

            <div className="mb-6">
                <KanjiGameCard
                    key={`${key}-${sessionId}`}
                    difficulty={difficulty}
                    onScoreUpdate={handleScoreUpdate}
                    disableNext={sessionComplete && playMode === "session"}
                />
            </div>
        </GamePageLayout>
    )
}
