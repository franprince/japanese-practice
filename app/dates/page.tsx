"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { DateGameCard } from "@/components/dates/date-game-card"
import { DateModeSelector } from "@/components/dates/date-mode-selector"
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
    const [answeredCount, setAnsweredCount] = useState(0)
    const [correctCount, setCorrectCount] = useState(0)
    const [sessionId, setSessionId] = useState(0)
    const [playMode, setPlayMode] = useState<"infinite" | "session">("infinite")
    const [targetCount, setTargetCount] = useState<number>(10)
    const [sessionComplete, setSessionComplete] = useState(false)
    const [key, setKey] = useState(0)
    const { t } = useI18n()

    const handleScoreUpdate = useCallback(
        (newScore: number, newStreak: number, correct: boolean) => {
            setScore(newScore)
            setStreak(newStreak)
            if (newStreak > bestStreak) {
                setBestStreak(newStreak)
            }
            setAnsweredCount((prev) => {
                const next = prev + 1
                if (playMode === "session" && next >= targetCount) {
                    setSessionComplete(true)
                }
                return next
            })
            if (correct) {
                setCorrectCount((prev) => prev + 1)
            }
        },
        [bestStreak, playMode, targetCount],
    )

    const handleModeChange = (newMode: DateMode) => {
        setMode(newMode)
        setKey((prev) => prev + 1)
        setScore(0)
        setStreak(0)
    }

    const resetSession = (mode?: "infinite" | "session") => {
        setSessionId((prev) => prev + 1)
        setScore(0)
        setStreak(0)
        setBestStreak(0)
        setAnsweredCount(0)
        setCorrectCount(0)
        setSessionComplete(false)
        if (mode) setPlayMode(mode)
    }

    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0
    const remainingQuestions = playMode === "session" ? Math.max(targetCount - answeredCount, 0) : undefined

    return (
        <main className="min-h-screen bg-background relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className="container max-w-2xl mx-auto px-4 py-6 md:py-10 relative">
                <header className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <Button asChild variant="ghost" size="sm" className="shrink-0 cursor-pointer -ml-3">
                            <Link href="/">← Home</Link>
                        </Button>
                        <LanguageSwitcher />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-balance bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
                            {t("datesTitle")}
                        </h1>
                        <p className="text-muted-foreground text-xs md:text-sm">{t("datesSubtitle")}</p>
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

                <div className="mb-6">
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
                        <DateGameCard key={`${key}-${sessionId}`} mode={mode} onScoreUpdate={handleScoreUpdate} />
                    )}
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
