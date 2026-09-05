"use client"

import { useState } from "react"
import { DateGameCard } from "@/components/dates/date-game-card"
import { DateModeSelector } from "@/components/dates/date-mode-selector"
import { StatsDisplay } from "@/components/game/stats-display"
import type { DateMode } from "@/lib/japanese/dates"
import { GameSettingsPopover } from "@/components/game/game-settings-popover"
import { SessionSummaryCard } from "@/components/game/session-summary-card"
import { GamePageLayout } from "@/components/layouts/game-page-layout"
import { useSessionProgress } from "@/hooks/use-session-progress"
import { useI18n } from "@/lib/i18n"
import { useEffect } from "react"
import { preloadKanaDictionary } from "@/lib/japanese/shared"

export default function DatesPage() {
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

    useEffect(() => {
        preloadKanaDictionary()
    }, [])

    const [mode, setMode] = useState<DateMode>("week_days")

    const handleModeChange = (newMode: DateMode) => {
        setMode(newMode)
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
                        onSelectMode={setPlayMode}
                        targetCount={targetCount}
                        onSelectCount={setTargetCount}
                        remainingQuestions={0}
                    />
                    <DateModeSelector mode={mode} onModeChange={handleModeChange} />
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
                <DateGameCard
                    sessionId={sessionId}
                    mode={mode}
                    onSessionEvent={handleSessionEvent}
                    disableNext={sessionComplete && playMode === "session"}
                />
            </div>
        </GamePageLayout>
    )
}
