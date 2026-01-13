"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import { GameCard } from "@/components/words/game-card"
import { ModeSelector } from "@/components/words/mode-selector"
import { StatsDisplay } from "@/components/game/stats-display"
import { RemainingBadge } from "@/components/game/remaining-badge"
import { type WordFilter, type CharacterGroup } from "@/lib/japanese-words"
import { getCharacterGroups } from "@/lib/data/kana-dictionary-loader"
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

    const [characterGroups, setCharacterGroups] = useState<CharacterGroup[]>([])
    const [isLoadingGroups, setIsLoadingGroups] = useState(true)

    // Preload character groups on mount
    useEffect(() => {
        getCharacterGroups().then(groups => {
            setCharacterGroups(groups)
            setIsLoadingGroups(false)
            // Initialize filter with all groups once loaded
            setFilter({
                selectedGroups: groups.map(g => g.id),
                minLength: 3,
                maxLength: 6,
            })
        })
    }, [])

    const [mode, setMode] = useState<GameMode>("hiragana")
    const [filter, setFilter] = useState<WordFilter>({
        selectedGroups: [], // Will be populated after groups load
        minLength: 3,
        maxLength: 6,
    })
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

            {!isLoadingGroups && (
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
            )}
        </GamePageLayout>
    )
}
