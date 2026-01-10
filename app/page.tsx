"use client";

import { useMemo, useState } from "react";

import { StatsDisplay } from "@/components/stats-display";
import { GameCard } from "@/components/game-card";
import { ModeSelector } from "@/components/mode-selector";
import { SettingsPanel } from "@/components/settings-panel";
import type { WordFilter } from "@/lib/japanese-words";

type GameMode = "hiragana" | "katakana" | "both";

export default function Page() {
  const [mode, setMode] = useState<GameMode>("both");
  const [filter, setFilter] = useState<WordFilter>({ selectedGroups: [], minLength: 1, maxLength: 10 });
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
        <header className="flex flex-col items-center gap-6 text-center">
          <div className="inline-flex items-center rounded-full border border-border/60 bg-card/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-sm backdrop-blur">
            Kana Practice
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Master Japanese Kana</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Drill romaji for hiragana and katakana words with streaks, filters, and quick mode switching.
            </p>
          </div>
          <ModeSelector mode={mode} onModeChange={setMode} />

          <div className="w-full max-w-3xl">
            <div className="flex justify-center mb-4">
              <SettingsPanel
                mode={mode}
                filter={filter}
                onFilterChange={setFilter}
                isOpen={settingsOpen}
                onToggle={() => setSettingsOpen(open => !open)}
              />
            </div>
            <div className="flex justify-center">
              <StatsDisplay score={score} streak={streak} bestStreak={bestStreak} />
            </div>
          </div>
        </header>

        <section className="mt-10 md:mt-12">
          <GameCard mode={mode} filter={filter} onScoreUpdate={handleScoreUpdate} />
        </section>

        <section className="mt-12 text-center text-sm text-muted-foreground space-y-2">
          <p>
            Mode: <span className="font-medium text-foreground">{modeLabel}</span>
          </p>
          <p className="text-xs">
            Tip: Press <kbd className="rounded border bg-white/70 px-1 py-0.5 text-[11px]">Enter</kbd> to check or move
            to the next word. Use filters to target specific character groups.
          </p>
        </section>
      </div>
    </main>
  );
}
