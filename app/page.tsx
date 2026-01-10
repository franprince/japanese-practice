"use client";

import { useMemo, useState, useEffect } from "react";

import { StatsDisplay } from "@/components/stats-display";
import { GameCard } from "@/components/game-card";
import { ModeSelector } from "@/components/mode-selector";
import { SettingsPanel } from "@/components/settings-panel";
import { Button } from "@/components/ui/button";
import type { WordFilter } from "@/lib/japanese-words";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

import type { GameMode } from "@/types/game";

function PageContent() {
    const FILTER_STORAGE_KEY = "kana-words-filter";
    const MODE_STORAGE_KEY = "kana-words-mode";

    const getStoredFilter = (): WordFilter | null => {
        if (typeof window === "undefined") return null;
        try {
            const stored = localStorage.getItem(FILTER_STORAGE_KEY);
            if (stored) return JSON.parse(stored) as WordFilter;
        } catch { }
        return null;
    };

    const getStoredMode = (): GameMode | null => {
        if (typeof window === "undefined") return null;
        const stored = localStorage.getItem(MODE_STORAGE_KEY);
        if (stored === "hiragana" || stored === "katakana" || stored === "both") return stored;
        return null;
    };

    const [mode, setModeState] = useState<GameMode>("hiragana");
    const [filter, setFilterState] = useState<WordFilter>({ selectedGroups: [], minLength: 1, maxLength: 10 });

    useEffect(() => {
        const storedMode = getStoredMode();
        if (storedMode) setModeState(storedMode);
        const storedFilter = getStoredFilter();
        if (storedFilter) setFilterState(storedFilter);
    }, []);

    const setMode = (next: GameMode) => {
        setModeState(next);
        if (typeof window !== "undefined") {
            localStorage.setItem(MODE_STORAGE_KEY, next);
        }
    };

    const setFilter = (next: WordFilter) => {
        setFilterState(next);
        if (typeof window !== "undefined") {
            localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(next));
        }
    };
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { t } = useI18n();

    const modeLabel = useMemo(() => {
        if (mode === "hiragana") return "ひらがな";
        if (mode === "katakana") return "カタカナ";
        return "ひらがな + カタカナ";
    }, [mode]);

    const handleScoreUpdate = (newScore: number, newStreak: number, correct: boolean) => {
        setScore(newScore);
        setStreak(newStreak);
        if (correct) {
            setBestStreak(prev => Math.max(prev, newStreak));
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-5xl px-4 pb-16 pt-12 md:pt-16">
                <header className="flex flex-col items-center gap-6 text-center relative">
                    <div className="w-full flex justify-end">
                        <LanguageSwitcher className="cursor-pointer" />
                    </div>
                    <div className="inline-flex items-center rounded-full border border-border/60 bg-card/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-sm backdrop-blur">
                        {t("chipLabel")}
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">{t("heroTitle")}</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">{t("heroSubtitle")}</p>
                    </div>
                    <div className="w-full max-w-3xl">
                        <section className="mt-10 md:mt-12">
                            <GameCard
                                mode={mode}
                                filter={filter}
                                onScoreUpdate={handleScoreUpdate}
                                suppressFocus={settingsOpen}
                                onRequestCloseSettings={() => setSettingsOpen(false)}
                            />
                        </section>
                    </div>

                    <div className="w-full max-w-3xl">
                        <div className="flex justify-center">
                            <StatsDisplay score={score} streak={streak} bestStreak={bestStreak} />
                        </div>
                        <ModeSelector mode={mode} onModeChange={setMode} />

                        {filter.selectedGroups.length === 0 && (
                            <div className="flex justify-center mt-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={() => {
                                        const el = document.getElementById("settings-panel")
                                        if (el) {
                                            el.scrollIntoView({ behavior: "smooth", block: "start" })
                                        } else {
                                            setSettingsOpen(true)
                                        }
                                    }}
                                >
                                    {t("settings")}
                                </Button>
                            </div>
                        )}

                        <div className="flex justify-center mb-4">
                            <SettingsPanel
                                mode={mode}
                                filter={filter}
                                onFilterChange={setFilter}
                                isOpen
                                onToggle={() => setSettingsOpen(open => !open)}
                            />
                        </div>
                    </div>
                </header>


                <section className="mt-12 text-center text-sm text-muted-foreground space-y-2">
                    <p>
                        {t("modeLabel")}: <span className="font-medium text-foreground">{modeLabel}</span>
                    </p>
                    <p className="text-xs">
                        {t("tip").replace("Enter", "")}
                        <kbd className="rounded border bg-white/70 px-1 py-0.5 text-[11px]">Enter</kbd>
                        {t("tip").includes("Enter") ? "" : ""}
                    </p>
                </section>
            </div>
        </main>
    );
}

export default function Page() {
    return (
        <I18nProvider>
            <PageContent />
        </I18nProvider>
    );
}
