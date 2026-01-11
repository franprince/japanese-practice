"use client"

import { useMemo } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { characterGroups, type WordFilter } from "@/lib/japanese-words"

interface WordsSettingsPopoverProps {
  filter: WordFilter
  onFilterChange: (filter: WordFilter) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WordsSettingsPopover({
  filter,
  onFilterChange,
  open,
  onOpenChange,
}: WordsSettingsPopoverProps) {
  const { t } = useI18n()

  const resetFilters = () => {
    onFilterChange({ ...filter, minLength: 1, maxLength: 10, selectedGroups: [] })
  }

  const toOrderNumber = (id: string) => {
    const match = id.match(/\d+/)
    return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER
  }

  // Include ALL groups from characterGroups (including _a groups)
  const { hiraganaBase, hiraganaAlt, katakanaBase, katakanaAlt } = useMemo(() => {
    const hiraAll = characterGroups.filter((g) => g.type === "hiragana")
    const kataAll = characterGroups.filter((g) => g.type === "katakana")
    return {
      hiraganaBase: hiraAll.filter((g) => !g.id.includes("_a")).sort((a, b) => toOrderNumber(a.id) - toOrderNumber(b.id)),
      hiraganaAlt: hiraAll.filter((g) => g.id.includes("_a")).sort((a, b) => toOrderNumber(a.id) - toOrderNumber(b.id)),
      katakanaBase: kataAll.filter((g) => !g.id.includes("_a")).sort((a, b) => toOrderNumber(a.id) - toOrderNumber(b.id)),
      katakanaAlt: kataAll.filter((g) => g.id.includes("_a")).sort((a, b) => toOrderNumber(a.id) - toOrderNumber(b.id)),
    }
  }, [])

  const allHiragana = [...hiraganaBase, ...hiraganaAlt]
  const allKatakana = [...katakanaBase, ...katakanaAlt]

  const toggleGroup = (groupId: string) => {
    const alreadySelected = filter.selectedGroups.includes(groupId)
    const newGroups = alreadySelected
      ? filter.selectedGroups.filter((g) => g !== groupId)
      : [...filter.selectedGroups, groupId]
    onFilterChange({ ...filter, selectedGroups: newGroups })
  }

  const selectAllGroups = (type: "hiragana" | "katakana") => {
    const groups = type === "hiragana" ? allHiragana : allKatakana
    const groupIds = groups.map((g) => g.id)
    const allSelected = groupIds.every((id) => filter.selectedGroups.includes(id))
    
    if (allSelected) {
      onFilterChange({ ...filter, selectedGroups: filter.selectedGroups.filter((g) => !groupIds.includes(g)) })
    } else {
      const newGroups = new Set([...filter.selectedGroups, ...groupIds])
      onFilterChange({ ...filter, selectedGroups: Array.from(newGroups) })
    }
  }

  const selectedHiraganaCount = allHiragana.filter((g) => filter.selectedGroups.includes(g.id)).length
  const selectedKatakanaCount = allKatakana.filter((g) => filter.selectedGroups.includes(g.id)).length

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={() => onOpenChange(false)} />

      {/* Popover */}
      <div className="absolute left-0 top-full mt-2 z-50 w-80 md:w-96 rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm p-3 md:p-4 shadow-lg space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{t("practiceSettings")}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            {t("reset")}
          </Button>
        </div>

        {/* Word length slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("wordLength")}</p>
            <span className="text-xs text-muted-foreground tabular-nums">
              {filter.minLength} - {filter.maxLength}
            </span>
          </div>
          <div className="px-1">
            <Slider
              value={[filter.minLength, filter.maxLength]}
              min={1}
              max={10}
              step={1}
              onValueChange={([min, max]) =>
                onFilterChange({
                  ...filter,
                  minLength: min ?? filter.minLength,
                  maxLength: max ?? filter.maxLength,
                })
              }
              className="w-full"
            />
          </div>
        </div>

        {/* Character groups */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">{t("charactersDescription")}</p>
          
          {filter.selectedGroups.length === 0 && (
            <div className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/40 rounded-md px-3 py-2">
              {t("selectGroupsHint")}
            </div>
          )}

          {/* Hiragana Base */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">ひらがな ({selectedHiraganaCount}/{allHiragana.length})</span>
              <button
                onClick={() => selectAllGroups("hiragana")}
                className="text-xs text-primary hover:underline"
              >
                {selectedHiraganaCount === allHiragana.length ? t("deselectAll") : t("selectAll")}
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {hiraganaBase.map((group) => (
                <button
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  title={group.labelJp}
                  className={cn(
                    "px-1.5 py-1 rounded text-xs transition-colors",
                    filter.selectedGroups.includes(group.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {group.characters[0]}
                </button>
              ))}
            </div>
            {/* Hiragana Alt (dakuten, handakuten, combos) */}
            {hiraganaAlt.length > 0 && (
              <div className="grid grid-cols-5 gap-1 pt-1">
                {hiraganaAlt.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    title={group.labelJp}
                    className={cn(
                      "px-1.5 py-1 rounded text-xs transition-colors",
                      filter.selectedGroups.includes(group.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {group.characters[0]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Katakana Base */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">カタカナ ({selectedKatakanaCount}/{allKatakana.length})</span>
              <button
                onClick={() => selectAllGroups("katakana")}
                className="text-xs text-primary hover:underline"
              >
                {selectedKatakanaCount === allKatakana.length ? t("deselectAll") : t("selectAll")}
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {katakanaBase.map((group) => (
                <button
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  title={group.labelJp}
                  className={cn(
                    "px-1.5 py-1 rounded text-xs transition-colors",
                    filter.selectedGroups.includes(group.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {group.characters[0]}
                </button>
              ))}
            </div>
            {/* Katakana Alt */}
            {katakanaAlt.length > 0 && (
              <div className="grid grid-cols-5 gap-1 pt-1">
                {katakanaAlt.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    title={group.labelJp}
                    className={cn(
                      "px-1.5 py-1 rounded text-xs transition-colors",
                      filter.selectedGroups.includes(group.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {group.characters[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
