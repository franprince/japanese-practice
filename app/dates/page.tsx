"use client"

import { useState } from "react"
import { DateGameCard } from "@/components/dates/date-game-card"
import { DateModeSelector } from "@/components/dates/date-mode-selector"
import { StatsDisplay } from "@/components/game/stats-display"
import { RemainingBadge } from "@/components/game/remaining-badge"
import type { DateMode } from "@/lib/japanese-dates"
import { GameSettingsPopover } from "@/components/game/game-settings-popover"
import { SessionSummaryCard } from "@/components/game/session-summary-card"
import { GamePageLayout } from "@/components/layouts/game-page-layout"
import { useGamePage } from "@/hooks/use-game-page"

export default function DatesPage() {
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
        t,
    } = useGamePage()

    const [mode, setMode] = useState<DateMode>("days")
    const [key, setKey] = useState(0)

    const handleModeChange = (newMode: DateMode) => {
        setMode(newMode)
        setKey((prev) => prev + 1)
        resetSession()
    }

    return (
        <GamePageLayout
            title={t("datesTitle")}
            subtitle={t("datesSubtitle")}
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
                    <DateModeSelector mode={mode} onModeChange={handleModeChange} />
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
                <DateGameCard
                    key={`${key}-${sessionId}`}
                    mode={mode}
                    onScoreUpdate={handleScoreUpdate}
                    disableNext={sessionComplete && playMode === "session"}
                />
            </div>
        </GamePageLayout>
    )
}
