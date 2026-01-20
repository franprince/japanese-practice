"use client"

import { useCallback, useState, useEffect } from "react"
import { GameCard } from "@/components/words/game-card"
import { ModeSelector } from "@/components/words/mode-selector"
import { StatsDisplay } from "@/components/game/stats-display"
import { RemainingBadge } from "@/components/game/remaining-badge"
import { type WordFilter, type CharacterGroup } from "@/lib/japanese/words"
import { getCharacterGroups } from "@/lib/japanese/shared"
import type { GameMode } from "@/types/game"
import { GameSettingsPopover } from "@/components/game/game-settings-popover"
import { WordsSettingsPopover } from "@/components/words/words-settings-popover"
import { SessionSummaryCard } from "@/components/game/session-summary-card"
import { GamePageLayout } from "@/components/layouts/game-page-layout"
import { useSessionProgress } from "@/hooks/use-session-progress"
import { useI18n } from "@/lib/i18n"
import { useMobileWordset } from "@/hooks/use-mobile-wordset"
import { MobileWordsetModal } from "@/components/words/mobile-wordset-modal"

export default function WordsPage() {
    const { t, lang } = useI18n()
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
    } = useSessionProgress({ t })

    const [characterGroups, setCharacterGroups] = useState<CharacterGroup[]>([])
    const [isLoadingGroups, setIsLoadingGroups] = useState(true)
    const [incorrectChars, setIncorrectChars] = useState<Map<string, { count: number; romaji: string }>>(new Map())

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

    // Use the mobile hook for mode and confirmations
    const {
        isCharacterMode,
        mobileConfirmOpen,
        downloadProgress,
        wordsetSizeMB,
        requestToggleCharacterMode,
        confirmWordMode,
        cancelConfirm
    } = useMobileWordset(lang)

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
        // Prevent re-render if mode is same (unless custom, which toggles settings)
        if (nextMode === mode && nextMode !== "custom") return

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

    const handleResetSession = useCallback(() => {
        resetSession()
        setIncorrectChars(new Map()) // Clear incorrect chars on session reset
    }, [resetSession])


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
                            handleResetSession()
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
                        onRestart={() => handleResetSession()}
                        onSwitchToInfinite={() => resetSession("infinite")}
                        incorrectChars={incorrectChars}
                        incorrectCharsLabel={t("incorrectChars")}
                        tableCharacterLabel={t("tableCharacter")}
                        tableErrorsLabel={t("tableErrors")}
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
                    onRequestOpenSettings={() => setCustomSettingsOpen(true)}
                    disableNext={sessionComplete && playMode === "session"}
                    isCharacterMode={isCharacterMode}
                    onToggleCharacterMode={requestToggleCharacterMode}
                    onIncorrectCharsChange={setIncorrectChars}
                />
            )}

            <MobileWordsetModal
                open={mobileConfirmOpen}
                title={t("words.downloadTitle") || "Download Word Set"}
                message={`${t("words.downloadMessage") || "The word set is large"} (~${wordsetSizeMB}MB).`}
                progress={downloadProgress}
                onCancel={cancelConfirm}
                onConfirm={confirmWordMode}
                confirmLabel={t("common.download") || "Download"}
                cancelLabel={t("common.cancel") || "Cancel"}
                confirmDisabled={downloadProgress !== null}
                cancelDisabled={downloadProgress !== null}
            />
        </GamePageLayout>
    )
}
