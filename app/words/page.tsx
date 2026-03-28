"use client"

import { useCallback, useState, useEffect } from "react"
import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GameCard } from "@/components/words/game-card"
import { WordsSettingsOverlay } from "@/components/words/words-settings-overlay"
import { StatsDisplay } from "@/components/game/stats-display"
import { type WordFilter, type CharacterGroup } from "@/lib/japanese/words"
import { getCharacterGroups } from "@/lib/japanese/shared"
import type { GameMode, WordsGameType } from "@/types/game"
import { SessionSummaryCard } from "@/components/game/session-summary-card"
import { GamePageLayout } from "@/components/layouts/game-page-layout"
import { useSessionProgress } from "@/hooks/use-session-progress"
import { useI18n } from "@/lib/i18n"
import { useMobileWordset } from "@/hooks/use-mobile-wordset"
import { MobileWordsetModal } from "@/components/words/mobile-wordset-modal"
import { WordsMobileMenu } from "@/components/words/words-mobile-menu"

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
    const [settingsOpen, setSettingsOpen] = useState(false)

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

    const handleResetSession = useCallback(() => {
        resetSession()
        setIncorrectChars(new Map())
    }, [resetSession])

    const handleApplySettings = (
        nextMode: GameMode,
        nextGameType: WordsGameType,
        nextPlayMode: "infinite" | "session",
        nextTargetCount: number,
        nextFilter: WordFilter
    ) => {
        // Only reset if things actually changed
        const somethingChanged = 
            nextMode !== mode || 
            nextGameType !== gameType || 
            nextPlayMode !== playMode || 
            nextTargetCount !== targetCount ||
            JSON.stringify(nextFilter) !== JSON.stringify(filter)

        if (somethingChanged) {
            setMode(nextMode)
            setGameType(nextGameType)
            if (nextPlayMode !== playMode) {
                resetSession(nextPlayMode)
            }
            setTargetCount(nextTargetCount)
            setFilter(nextFilter)
            handleResetSession()
            setBestStreak(0)
        }
    }

    const SettingsTrigger = (
      <Button
        onClick={() => setSettingsOpen(true)}
        variant="outline"
        data-testid="settings-trigger"
        className="group relative h-10 md:h-12 px-4 md:px-6 rounded-full bg-background/20 backdrop-blur-md border border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center gap-2 md:gap-3">
          <div className="p-1 px-1.5 bg-primary/10 rounded-lg border border-primary/20 text-primary">
            <Settings2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </div>
          <div className="flex flex-col items-start leading-none text-left">
            <span className="hidden md:block text-[9px] font-black uppercase tracking-widest text-primary/60 mb-0.5">
              {t("practiceSettings") || "Settings"}
            </span>
                <span className="hidden md:block font-black uppercase tracking-widest text-[10px]">
                  {t("commandCenter") || "Command Center"}
                </span>
          </div>
        </div>
      </Button>
    )

    return (
        <GamePageLayout
            title={t("wordsLabel")}
            subtitle={t("tip")}
            settingsTrigger={SettingsTrigger}
            controls={null}
            stats={
                <div className="hidden md:flex w-full flex-col items-center gap-4">
                    <StatsDisplay 
                        score={score} 
                        streak={streak} 
                        bestStreak={bestStreak} 
                        remainingLabel={remainingLabel} 
                    />
                </div>
            }
        >
            <WordsSettingsOverlay
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                mode={mode}
                gameType={gameType}
                playMode={playMode}
                targetCount={targetCount}
                filter={filter}
                onApply={handleApplySettings}
                characterGroups={characterGroups}
            />

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
                    onRequestCloseSettings={() => setSettingsOpen(false)}
                    onRequestOpenSettings={() => setSettingsOpen(true)}
                    disableNext={sessionComplete && playMode === "session"}
                    gameType={gameType}
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

            {/* Mobile-only Bottom Menu HUD */}
            {!settingsOpen && (
              <WordsMobileMenu 
                  score={score}
                  streak={streak}
                  mode={mode}
                  gameType={gameType}
                  onOpenSettings={() => setSettingsOpen(true)}
              />
            )}
        </GamePageLayout>
    )
}
