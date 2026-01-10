"use client"

import { useCallback, useMemo, useState } from "react"
import { GameCard } from "@/components/game-card"
import { ModeSelector } from "@/components/mode-selector"
import { SettingsPanel } from "@/components/settings-panel"
import { StatsDisplay } from "@/components/stats-display"
import { LanguageSwitcher } from "@/components/language-switcher"
import { characterGroups, type WordFilter } from "@/lib/japanese-words"
import { useI18n } from "@/lib/i18n"
import type { GameMode } from "@/types/game"

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
    const [score, setScore] = useState(0)
    const [streak, setStreak] = useState(0)
    const [bestStreak, setBestStreak] = useState(0)
    const [settingsOpen, setSettingsOpen] = useState(false)

    const handleScoreUpdate = useCallback((newScore: number, newStreak: number, correct: boolean) => {
        setScore(newScore)
        setStreak(newStreak)
        if (newStreak > bestStreak) {
            setBestStreak(newStreak)
        }
        if (!correct) {
            setSettingsOpen(false)
        }
    }, [bestStreak])

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
        setScore(0)
        setStreak(0)
    }

    const handleFilterChange = (next: WordFilter) => {
        setFilter(next)
    }

    return (
        <main className="min-h-screen bg-background relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className="container max-w-3xl mx-auto px-4 py-6 md:py-10 relative">
                <header className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-balance bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
                            {t("wordsLabel")}
                        </h1>
                        <p className="text-muted-foreground text-xs md:text-sm">{t("tip")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                    </div>
                </header>

                <ModeSelector mode={mode} onModeChange={handleModeChange} />

                <div className="mt-6 mb-6">
                    <GameCard
                        mode={mode}
                        filter={filter}
                        onScoreUpdate={handleScoreUpdate}
                        onRequestCloseSettings={() => setSettingsOpen(false)}
                    />
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
