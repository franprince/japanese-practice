"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { DateGameCard } from "@/components/date-game-card"
import { DateModeSelector } from "@/components/date-mode-selector"
import { StatsDisplay } from "@/components/stats-display"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import type { DateMode } from "@/lib/japanese-dates"
import { useI18n } from "@/lib/i18n"

export default function DatesPage() {
    const [mode, setMode] = useState<DateMode>("days")
    const [score, setScore] = useState(0)
    const [streak, setStreak] = useState(0)
    const [bestStreak, setBestStreak] = useState(0)
    const [key, setKey] = useState(0)
    const { t } = useI18n()

    const handleScoreUpdate = useCallback(
        (newScore: number, newStreak: number, correct: boolean) => {
            setScore(newScore)
            setStreak(newStreak)
            if (newStreak > bestStreak) {
                setBestStreak(newStreak)
            }
        },
        [bestStreak],
    )

    const handleModeChange = (newMode: DateMode) => {
        setMode(newMode)
        setKey((prev) => prev + 1)
        setScore(0)
        setStreak(0)
    }

    return (
        <main className="min-h-screen bg-background relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className="container max-w-2xl mx-auto px-4 py-6 md:py-10 relative">
                <header className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-balance bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
                            {t("datesTitle")}
                        </h1>
                        <p className="text-muted-foreground text-xs md:text-sm">{t("datesSubtitle")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/" className="hidden sm:block">
                            <Button variant="ghost" size="sm" className="cursor-pointer">
                                Home
                            </Button>
                        </Link>
                        <LanguageSwitcher />
                    </div>
                </header>

                <div className="mb-6">
                    <DateGameCard key={key} mode={mode} onScoreUpdate={handleScoreUpdate} />
                </div>

                <div className="mb-6">
                    <StatsDisplay score={score} streak={streak} bestStreak={bestStreak} />
                </div>

                <div className="space-y-4">
                    <DateModeSelector mode={mode} onModeChange={handleModeChange} />
                </div>

                <footer className="mt-10 text-center">
                    <p className="text-xs text-muted-foreground/60">
                        {t("pressEnter")}{" "}
                        <kbd className="px-2 py-1 bg-secondary/50 rounded-md text-[10px] font-mono border border-border/50">
                            Enter
                        </kbd>{" "}
                        {t("toSubmit")}
                    </p>
                </footer>
            </div>
        </main>
    )
}
