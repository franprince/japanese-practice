"use client"

import { useState, useEffect } from "react"
import { KanjiGameCard } from "@/components/kanji/kanji-game-card"
import { KanjiDifficultySelector } from "@/components/kanji/kanji-difficulty-selector"
import { StatsDisplay } from "@/components/game/stats-display"
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
        handleSessionEvent,
        resetSession,
        setTargetCount,
        setPlayMode,
        remainingLabel,
        sessionSummaryProps,
    } = useSessionProgress({ t })

    const [difficulty, setDifficulty] = useState<KanjiDifficulty>("easy")

    // Preload kana dictionary for romaji conversion in option cards
    useEffect(() => {
        preloadKanaDictionary()
    }, [])

    const handleDifficultyChange = (newDifficulty: KanjiDifficulty) => {
        if (newDifficulty === difficulty) return // Don't reset if same difficulty
        setDifficulty(newDifficulty)
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
                        onSelectMode={setPlayMode}
                        targetCount={targetCount}
                        onSelectCount={setTargetCount}
                    />
                    <KanjiDifficultySelector difficulty={difficulty} onDifficultyChange={handleDifficultyChange} />
                </>
            }
            stats={
                <StatsDisplay score={score} streak={streak} bestStreak={bestStreak} remainingLabel={remainingLabel} />
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
                    sessionId={sessionId}
                    difficulty={difficulty}
                    onSessionEvent={handleSessionEvent}
                    disableNext={sessionComplete && playMode === "session"}
                />
            </div>
        </GamePageLayout>
    )
}
