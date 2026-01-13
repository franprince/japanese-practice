"use client"

import { useCallback, useMemo, useState } from "react"
import { GameCard } from "@/components/words/game-card"
import { ModeSelector } from "@/components/words/mode-selector"
import { StatsDisplay } from "@/components/game/stats-display"
import { RemainingBadge } from "@/components/game/remaining-badge"
import { characterGroups, type WordFilter } from "@/lib/japanese-words"
import type { GameMode } from "@/types/game"
import { GameSettingsPopover } from "@/components/game/game-settings-popover"
import { WordsSettingsPopover } from "@/components/words/words-settings-popover"
import { SessionSummaryCard } from "@/components/game/session-summary-card"
import { GamePageLayout } from "@/components/layouts/game-page-layout"
import { useGamePage } from "@/hooks/use-game-page"

export default function WordsPage() {
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
        setBestStreak,
        remainingLabel,
        sessionSummaryProps,
        t,
    } = useGamePage()

    const defaultFilter = useMemo<WordFilter>(
        () => ({
            selectedGroups: characterGroups.map((group) => group.id),
            minLength: 1,
            maxLength: 10,
        }),
        [],
    )

    const [mode, setMode] = useState<GameMode>("hiragana")
    const [filter, setFilter] = useState<WordFilter>(defaultFilter)
    const [customSettingsOpen, setCustomSettingsOpen] = useState(false)
    const [isCharacterMode, setIsCharacterMode] = useState(false)

    const handleScoreUpdateWithUi = useCallback(
        (newScore: number, newStreak: number, correct: boolean) => {
            handleScoreUpdate(newScore, newStreak, correct)
            if (!correct) {
                setCustomSettingsOpen(false)
            }
        },
        [handleScoreUpdate],
    )

    const handleModeChange = (nextMode: GameMode) => {
        // Custom: open popover and avoid resetting the game so the menu stays open
        if (nextMode === "custom") {
            setMode(nextMode)
            setCustomSettingsOpen(true)
            return
        }

        // Preset modes: close popover, auto-select relevant groups, and reset session
        setCustomSettingsOpen(false)
        setMode(nextMode)
        const allowedGroups =
            nextMode === "both"
                ? characterGroups.map((g) => g.id)
                : characterGroups.filter((g) => g.type === nextMode).map((g) => g.id)
        setFilter((prev) => ({
            ...prev,
            selectedGroups: allowedGroups,
        }))
        resetSession()
        setBestStreak(0)
    }

    const handleFilterChange = (next: WordFilter) => {
        setFilter(next)
    }

    return (
        <GamePageLayout
            title={t("wordsLabel")}
            subtitle={t("tip")}
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
                    <ModeSelector
                        mode={mode}
                        onModeChange={handleModeChange}
                        onCustomClick={() => setCustomSettingsOpen(true)}
                    />
                    <WordsSettingsPopover
                        filter={filter}
                        onFilterChange={handleFilterChange}
                        open={customSettingsOpen}
                        onOpenChange={setCustomSettingsOpen}
                    />
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
                <div className="mb-6">
                    <SessionSummaryCard
                        {...sessionSummaryProps}
                        onRestart={() => resetSession()}
                        onSwitchToInfinite={() => resetSession("infinite")}
                    />
                </div>
            )}

            <GameCard
                key={sessionId}
                mode={mode}
                filter={filter}
                onScoreUpdate={handleScoreUpdateWithUi}
                onRequestCloseSettings={() => setCustomSettingsOpen(false)}
                disableNext={sessionComplete && playMode === "session"}
                isCharacterMode={isCharacterMode}
                onToggleCharacterMode={() => setIsCharacterMode(prev => !prev)}
            />
        </GamePageLayout>
    )
}
