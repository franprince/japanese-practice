"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { GameCard } from "@/components/words/game-card"
import { ModeSelector } from "@/components/words/mode-selector"
import { StatsDisplay } from "@/components/stats-display"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import { characterGroups, type WordFilter } from "@/lib/japanese-words"
import { useI18n } from "@/lib/i18n"
import type { GameMode } from "@/types/game"
import { useSessionProgress } from "@/hooks/use-session-progress"
import { GameSettingsPopover } from "@/components/session/game-settings-popover"
import { WordsSettingsPopover } from "@/components/words/words-settings-popover"
import { SessionSummaryCard } from "@/components/session/session-summary-card"

export default function WordsPage() {
    const { t } = useI18n()
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
    const {
        score,
        streak,
        bestStreak,
        answeredCount,
        correctCount,
        sessionId,
        playMode,
        targetCount,
        sessionComplete,
        accuracy,
        remainingQuestions,
        handleScoreUpdate,
        resetSession,
        setTargetCount,
        setSessionComplete,
        setBestStreak,
    } = useSessionProgress()
    const [customSettingsOpen, setCustomSettingsOpen] = useState(false)

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
        setMode(nextMode)
        // For custom mode, open settings and keep current selection; for others, auto-select relevant groups
        if (nextMode === "custom") {
            setCustomSettingsOpen(true)
        } else {
            setCustomSettingsOpen(false)
            const allowedGroups =
                nextMode === "both"
                    ? characterGroups.map((g) => g.id)
                    : characterGroups.filter((g) => g.type === nextMode).map((g) => g.id)
            setFilter((prev) => ({
                ...prev,
                selectedGroups: allowedGroups,
            }))
        }
        resetSession()
        setBestStreak(0)
    }

    const handleFilterChange = (next: WordFilter) => {
        setFilter(next)
    }

    return (
        <main className="min-h-screen bg-background relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className="container max-w-3xl mx-auto px-4 py-6 md:py-10 relative">
                <header className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <Button asChild variant="ghost" size="sm" className="shrink-0 cursor-pointer -ml-3">
                            <Link href="/">← Home</Link>
                        </Button>
                        <LanguageSwitcher />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-balance bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
                            {t("wordsLabel")}
                        </h1>
                        <p className="text-muted-foreground text-xs md:text-sm">{t("tip")}</p>
                    </div>
                </header>

                {/* Compact controls row */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 relative">
                    <GameSettingsPopover
                        playMode={playMode}
                        onSelectMode={resetSession}
                        targetCount={targetCount}
                        onSelectCount={(count) => {
                            setTargetCount(count)
                            resetSession()
                        }}
                        remainingQuestions={remainingQuestions ?? 0}
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
                </div>

                <div className="mt-6 mb-6">
                    {sessionComplete && playMode === "session" && (
                        <div className="mb-6">
                            <SessionSummaryCard
                                title={t("sessionCompleteTitle")}
                                targetLabel={t("sessionTargetLabel")}
                                correctLabel={t("sessionCorrectLabel")}
                                accuracyLabel={t("sessionAccuracyLabel")}
                                targetCount={targetCount}
                                correctCount={correctCount}
                                accuracy={accuracy}
                                onRestart={() => resetSession()}
                                onSwitchToInfinite={() => resetSession("infinite")}
                                restartLabel={t("sessionRestart")}
                                switchLabel={t("sessionSwitchToInfinite")}
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
                    />
                </div>

                <div className="mb-6">
                    <StatsDisplay score={score} streak={streak} bestStreak={bestStreak} />
                </div>

            </div>
        </main>
    )
}
