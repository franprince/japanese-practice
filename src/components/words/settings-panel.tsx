import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/core"
import { characterGroups, type WordFilter } from "@/lib/japanese/words"
import { RotateCcw } from "lucide-react"
import { useI18n } from "@/lib/i18n"

import type { GameMode } from "@/types/game"

interface SettingsPanelProps {
  mode: GameMode
  filter: WordFilter
  onFilterChange: (filter: WordFilter) => void
}

export function SettingsPanel({ mode, filter, onFilterChange }: SettingsPanelProps) {
  const { t } = useI18n()

  const sortGroups = (groups: typeof characterGroups) => [...groups].sort((a, b) => a.label.localeCompare(b.label))

  const toOrderNumber = (id: string) => {
    const match = id.match(/\d+/)
    return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER
  }

  const { hiraganaBase, hiraganaAlt, katakanaBase, katakanaAlt } = useMemo(() => {
    const relevantGroups = sortGroups(characterGroups.filter((g) => (mode === "both" ? true : g.type === mode)))
    const groupsByType = {
      hiragana: sortGroups(relevantGroups.filter((g) => g.type === "hiragana")),
      katakana: sortGroups(relevantGroups.filter((g) => g.type === "katakana")),
    }
    return {
      hiraganaBase: groupsByType.hiragana
        .filter((g) => !g.id.includes("_a"))
        .sort((a, b) => toOrderNumber(a.id) - toOrderNumber(b.id)),
      hiraganaAlt: groupsByType.hiragana
        .filter((g) => g.id.includes("_a"))
        .sort((a, b) => toOrderNumber(a.id) - toOrderNumber(b.id)),
      katakanaBase: groupsByType.katakana
        .filter((g) => !g.id.includes("_a"))
        .sort((a, b) => toOrderNumber(a.id) - toOrderNumber(b.id)),
      katakanaAlt: groupsByType.katakana
        .filter((g) => g.id.includes("_a"))
        .sort((a, b) => toOrderNumber(a.id) - toOrderNumber(b.id)),
    }
  }, [mode])

  const isGroupSelected = (groupId: string, selectedGroups: string[]) => selectedGroups.includes(groupId)

  const toggleGroup = (groupId: string) => {
    const alreadySelected = filter.selectedGroups.includes(groupId)
    const newGroups = alreadySelected
      ? filter.selectedGroups.filter((g) => g !== groupId)
      : [...filter.selectedGroups, groupId]
    onFilterChange({ ...filter, selectedGroups: newGroups })
  }

  const resetFilters = () => {
    onFilterChange({ selectedGroups: [], minLength: 1, maxLength: 10 })
  }

  const GroupSection = ({ title, groups }: { title: string; groups: typeof characterGroups }) => {
    if (groups.length === 0) return null
    const effectiveSelected = new Set(filter.selectedGroups)

    const groupIds = groups.map((g) => g.id)
    const allSelected = groupIds.every((id) => effectiveSelected.has(id))

    const handleSelectAll = () => {
      const nextSelected = new Set(effectiveSelected)
      if (allSelected) {
        groupIds.forEach((id) => nextSelected.delete(id))
      } else {
        groupIds.forEach((id) => nextSelected.add(id))
      }
      const nextArray = [...nextSelected]
      onFilterChange({ ...filter, selectedGroups: nextArray })
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {allSelected ? t("deselectAll") : t("selectAll")}
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => toggleGroup(group.id)}
              aria-pressed={isGroupSelected(group.id, filter.selectedGroups)}
              data-selected={isGroupSelected(group.id, filter.selectedGroups) ? "true" : "false"}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all border w-full text-left flex justify-between items-center cursor-pointer",
                isGroupSelected(group.id, filter.selectedGroups)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-muted-foreground border-border/50 hover:bg-secondary hover:text-foreground",
              )}
            >
              <span lang="ja" className="mr-2">{group.labelJp}</span>
              <span className="opacity-70">{group.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div id="settings-panel" className="w-full max-w-2xl mx-auto space-y-2 mt-8 md:mt-10">
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm max-w-2xl w-full mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t("characters")}</CardTitle>
            <div className="flex items-center gap-2">
              {filter.selectedGroups.length > 0 && (
                <span className="text-xs text-primary">
                  {filter.selectedGroups.length} {t("selectedCount")}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                {t("reset")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">{t("charactersDescription")}</p>
          {filter.selectedGroups.length === 0 && (
            <div className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/40 rounded-md px-3 py-2 flex items-start gap-2">
              <span className="mt-[2px]">⚠️</span>
              <span>{t("selectGroupsHint")}</span>
            </div>
          )}

          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
            {(mode === "hiragana" || mode === "both") && (
              <div className="space-y-4">
                {mode === "both" && (
                  <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
                    Hiragana <span lang="ja">ひらがな</span>
                  </h3>
                )}
                <GroupSection title={t("allHiragana")} groups={hiraganaBase} />
                {hiraganaAlt.length > 0 && (
                  <GroupSection title={t("altHiragana")} groups={hiraganaAlt} />
                )}
              </div>
            )}

            {(mode === "katakana" || mode === "both") && (
              <div className="space-y-4">
                {mode === "both" && (
                  <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2 mt-6">
                    Katakana <span lang="ja">カタカナ</span>
                  </h3>
                )}
                <GroupSection title={t("allKatakana")} groups={katakanaBase} />
                {katakanaAlt.length > 0 && (
                  <GroupSection title={t("altKatakana")} groups={katakanaAlt} />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
