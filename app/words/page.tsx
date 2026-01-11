"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { GameCard } from "@/components/words/game-card"
import { ModeSelector } from "@/components/words/mode-selector"
import { SettingsPanel } from "@/components/words/settings-panel"
import { StatsDisplay } from "@/components/stats-display"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import { characterGroups, type WordFilter } from "@/lib/japanese-words"
import { useI18n } from "@/lib/i18n"
import type { GameMode } from "@/types/game"
import { useSessionProgress } from "@/hooks/use-session-progress"

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
    const [settingsOpen, setSettingsOpen] = useState(false)

    const handleScoreUpdateWithUi = useCallback(
        (newScore: number, newStreak: number, correct: boolean) => {
            handleScoreUpdate(newScore, newStreak, correct)
            if (!correct) {
                setSettingsOpen(false)
            }
        },
        [handleScoreUpdate],
    )

    const handleModeChange = (nextMode: GameMode) => {
        setMode(nextMode)
        // Keep only groups relevant to the selected mode when not practicing both.
        const allowedGroups =
            nextMode === "both"
                ? characterGroups.map((g) => g.id)
                : characterGroups.filter((g) => g.type === nextMode).map((g) => g.id)
        setFilter((prev) => ({
            ...prev,
            selectedGroups: prev.selectedGroups.filter((g) => allowedGroups.includes(g)),
        }))
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

                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="inline-flex rounded-full border border-border/60 bg-card/70 p-1">
                        <Button
                            variant={playMode === "infinite" ? "default" : "ghost"}
                            size="sm"
                            className="rounded-full"
                            onClick={() => resetSession("infinite")}
                        >
                            {t("playModeInfinite")}
                        </Button>
                        <Button
                            variant={playMode === "session" ? "default" : "ghost"}
                            size="sm"
                            className="rounded-full"
                            onClick={() => resetSession("session")}
                        >
                            {t("playModeSession")}
                        </Button>
                    </div>
                    {playMode === "session" && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{t("questionsLabel")}:</span>
                            <div className="inline-flex rounded-full border border-border/60 bg-card/70 p-1">
                                {[5, 10, 15, 20].map((count) => (
                                    <Button
                                        key={count}
                                        variant={targetCount === count ? "default" : "ghost"}
                                        size="sm"
                                        className="rounded-full"
                                        onClick={() => {
                                            setTargetCount(count)
                                            resetSession()
                                        }}
                                    >
                                        {count}
                                    </Button>
                                ))}
                            </div>
                            <span className="text-xs text-muted-foreground/80">
                                {t("questionsLeft").replace("{count}", String(remainingQuestions))}
                            </span>
                        </div>
                    )}
                </div>

                <ModeSelector mode={mode} onModeChange={handleModeChange} />

                <div className="mt-6 mb-6">
                    {sessionComplete && playMode === "session" ? (
                        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm space-y-4 text-center">
                            <h2 className="text-xl font-semibold text-foreground">{t("sessionCompleteTitle")}</h2>
                            <p className="text-sm text-muted-foreground">
                                {t("sessionTargetLabel")}: {targetCount} • {t("sessionCorrectLabel")}: {correctCount} • {t("sessionAccuracyLabel")}: {accuracy}%
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button className="cursor-pointer" onClick={() => resetSession()}>
                                    {t("sessionRestart")}
                                </Button>
                                <Button variant="secondary" className="cursor-pointer" onClick={() => resetSession("infinite")}>
                                    {t("sessionSwitchToInfinite")}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <GameCard
                            key={sessionId}
                            mode={mode}
                            filter={filter}
                            onScoreUpdate={handleScoreUpdateWithUi}
                            onRequestCloseSettings={() => setSettingsOpen(false)}
                        />
                    )}
                </div>

                <div className="mb-6">
                    <StatsDisplay score={score} streak={streak} bestStreak={bestStreak} />
                </div>

                <SettingsPanel
                    mode={mode}
                    filter={filter}
                    onFilterChange={handleFilterChange}
                    isOpen
                    onToggle={() => { }}
                />
            </div>
        </main>
    )
}
