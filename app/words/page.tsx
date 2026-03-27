"use client"

import { useCallback, useState, useEffect } from "react"
import { GameCard } from "@/components/words/game-card"
import { WordsTopbar } from "@/components/words/words-topbar"
import { WordsSettingsOverlay } from "@/components/words/words-settings-overlay"
import { StatsDisplay } from "@/components/game/stats-display"
import { RemainingBadge } from "@/components/game/remaining-badge"
import { type WordFilter, type CharacterGroup } from "@/lib/japanese/words"
import { getCharacterGroups } from "@/lib/japanese/shared"
import type { GameMode, WordsGameType } from "@/types/game"
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
    const [showSettings, setShowSettings] = useState(false)

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

    const {
        gameType,
        mobileConfirmOpen,
        downloadProgress,
        wordsetSizeMB,
        setGameType,
        confirmWordMode,
        cancelConfirm
    } = useMobileWordset(lang)

    const handleScoreUpdateWithUi = useCallback(
        (newScore: number, newStreak: number, correct: boolean) => {
            handleScoreUpdate(newScore, newStreak, correct)
        },
        [handleScoreUpdate],
    )

    const handleModeChange = (nextMode: GameMode) => {
        setMode(nextMode)
        
        // Preset modes: auto-select relevant groups
        if (nextMode !== "custom") {
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
    }

    const handleResetSession = useCallback(() => {
        resetSession()
        setIncorrectChars(new Map())
    }, [resetSession])

    return (
        <GamePageLayout
            title={t("wordsLabel")}
            subtitle={t("tip")}
            topbarContent={
                <WordsTopbar
                    mode={mode}
                    playMode={playMode}
                    targetCount={targetCount}
                    gameType={gameType}
                    onOpenSettings={() => setShowSettings(true)}
                />
            }
            stats={
                <div className="w-full flex flex-col items-center gap-4">
                    <div className="md:hidden">
                        <RemainingBadge label={remainingLabel} />
                    </div>
                    <StatsDisplay score={score} streak={streak} bestStreak={bestStreak} remainingLabel={remainingLabel} />
                </div>
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
                    onRequestCloseSettings={() => setShowSettings(false)}
                    onRequestOpenSettings={() => setShowSettings(true)}
                    disableNext={sessionComplete && playMode === "session"}
                    gameType={gameType}
                    onIncorrectCharsChange={setIncorrectChars}
                />
            )}

            <WordsSettingsOverlay
                open={showSettings}
                onOpenChange={setShowSettings}
                mode={mode}
                onModeChange={handleModeChange}
                gameType={gameType}
                onGameTypeChange={setGameType}
                playMode={playMode}
                onPlayModeChange={(m) => {
                    if (m === "infinite") resetSession("infinite")
                    else resetSession("session")
                }}
                targetCount={targetCount}
                onTargetCountChange={(count) => {
                    setTargetCount(count)
                    handleResetSession()
                }}
                filter={filter}
                onFilterChange={setFilter}
            />

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
