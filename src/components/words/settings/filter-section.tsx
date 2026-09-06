"use client"

import * as React from "react"
import { AlertCircle, CheckCircle2, Infinity as LucideInfinity } from "lucide-react"
import { cn } from "@/lib/core"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import type { CharacterGroup, WordFilter } from "@/types/japanese"
import type { GameMode, WordsGameType } from "@/types/game"

interface FilterSectionProps {
  mode: GameMode
  gameType: WordsGameType
  filter: WordFilter
  characterGroups: CharacterGroup[]
  onFilterChange: React.Dispatch<React.SetStateAction<WordFilter>>
  sectionRef: React.Ref<HTMLDivElement>
}

// Renders group and length controls from the shell-owned draft.
export function FilterSection({ mode, gameType, filter, characterGroups, onFilterChange, sectionRef }: FilterSectionProps) {
  const { t } = useI18n()
  // Queue changes against the latest shell-owned draft, including batched edits.
  const update = (change: (filter: WordFilter) => WordFilter) => onFilterChange(change)
  const toggleGroup = (groupId: string) => update(current => ({
    ...current,
    selectedGroups: current.selectedGroups.includes(groupId)
      ? current.selectedGroups.filter(id => id !== groupId)
      : [...current.selectedGroups, groupId],
  }))
  const selectAll = () => update(current => ({ ...current, selectedGroups: characterGroups.map(group => group.id) }))
  const deselectAll = () => update(current => ({ ...current, selectedGroups: [] }))

  return (
    <section
      ref={sectionRef}
      className={cn(
        "space-y-4 transition-all scroll-mt-6",
        mode !== "custom" && "hidden"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium tracking-[0.2em]">{t("characters")}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={selectAll} className="text-sm min-h-11 px-3 bg-secondary hover:bg-muted">{t("selectAll")}</Button>
          <Button variant="ghost" size="sm" onClick={deselectAll} className="text-sm min-h-11 px-3 bg-secondary hover:bg-muted">{t("deselectAll")}</Button>
        </div>
      </div>

      {(gameType === "words" || gameType === "characters") && (
        <div className="space-y-6 pt-2 pb-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium px-1">
                {gameType === "words" ? t("settings.wordLength") : t("settings.characterLength")}
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    update(prev => ({ ...prev, minLength: 1, maxLength: 100 }));
                  }}
                  className="text-sm min-h-11 px-3 bg-secondary hover:bg-muted"
                >
                  {t("settings.any") || "Any"}
                </Button>
                <span className="flex items-center gap-1 text-sm font-medium tabular-nums bg-primary/10 text-primary px-2 py-1.5 rounded-lg border border-primary/20 transition-all duration-300">
                  {filter.maxLength > 10 ? (
                    <>
                      <LucideInfinity className="w-3 h-3" />
                      <span className="text-sm">{t("settings.any") || "Any"}</span>
                    </>
                  ) : (
                    <>{filter.minLength} — {filter.maxLength}</>
                  )}
                </span>
              </div>
            </div>

            <div className="px-2 py-2">
              <Slider
                min={1}
                max={10}
                step={1}
                thumbLabels={[t("practice.minimumLength"), t("practice.maximumLength")]}
                value={[Math.min(filter.minLength, 10), Math.min(filter.maxLength, 10)]}
                onValueChange={(vals: number[]) => {
                  if (vals.length === 2 && vals[0] !== undefined && vals[1] !== undefined) {
                    update(prev => ({
                      ...prev,
                      minLength: vals[0] ?? 1,
                      maxLength: vals[1] ?? 10
                    }))
                  }
                }}
                className="w-full"
              />
            </div>
          </div>
          <div className="h-px bg-secondary mx-auto w-1/2" />
        </div>
      )}

      <div className="space-y-6">
        {/* Hiragana Subsection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium px-1">{t("hiraganaLabel")}</h4>
          <div className="grid grid-cols-[repeat(4,1fr)] sm:grid-cols-[repeat(6,1fr)] gap-2 max-w-sm mx-auto w-full">
            {characterGroups.filter(g => g.type === "hiragana").map(group => {
              const isSelected = filter.selectedGroups.includes(group.id)
              const char = group.characters?.[0] || "?"

              return (
                <button
                  aria-pressed={isSelected}
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "flex aspect-square w-full items-center justify-center p-0 rounded-2xl border transition-all relative overflow-hidden",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary z-10"
                      : "bg-secondary border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className="text-xl font-medium leading-none">{char}</span>
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Katakana Subsection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium px-1">{t("katakanaLabel")}</h4>
          <div className="grid grid-cols-[repeat(4,1fr)] sm:grid-cols-[repeat(6,1fr)] gap-2 max-w-sm mx-auto w-full">
            {characterGroups.filter(g => g.type === "katakana").map(group => {
              const isSelected = filter.selectedGroups.includes(group.id)
              const char = group.characters?.[0] || "?"

              return (
                <button
                  aria-pressed={isSelected}
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "flex aspect-square w-full items-center justify-center p-0 rounded-2xl border transition-all relative overflow-hidden",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary z-10"
                      : "bg-secondary border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className="text-xl font-medium leading-none">{char}</span>
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {mode === "custom" && filter.selectedGroups.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in slide-in-from-top-2">
          <AlertCircle className="w-3 h-3" />
          {t("selectGroupsHint")}
        </div>
      )}
    </section>
  )
}
