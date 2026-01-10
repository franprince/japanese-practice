import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { characterGroups, type WordFilter } from "@/lib/japanese-words"
import { Settings, X, RotateCcw } from "lucide-react"

type GameMode = "hiragana" | "katakana" | "both"

interface SettingsPanelProps {
  mode: GameMode
  filter: WordFilter
  onFilterChange: (filter: WordFilter) => void
  isOpen: boolean
  onToggle: () => void
}

export function SettingsPanel({ mode, filter, onFilterChange, isOpen, onToggle }: SettingsPanelProps) {
  const sortGroups = (groups: typeof characterGroups) => [...groups].sort((a, b) => a.label.localeCompare(b.label))

  const relevantGroups = sortGroups(characterGroups.filter((g) => (mode === "both" ? true : g.type === mode)))

  const groupsByType = {
    hiragana: sortGroups(relevantGroups.filter((g) => g.type === "hiragana")),
    katakana: sortGroups(relevantGroups.filter((g) => g.type === "katakana")),
  }

  const toggleGroup = (groupId: string) => {
    const newGroups = filter.selectedGroups.includes(groupId)
      ? filter.selectedGroups.filter((g) => g !== groupId)
      : [...filter.selectedGroups, groupId]
    onFilterChange({ ...filter, selectedGroups: newGroups })
  }

  const selectAll = (groups: typeof relevantGroups) => {
    const groupIds = groups.map((g) => g.id)
    const allSelected = groupIds.every((id) => filter.selectedGroups.includes(id))
    if (allSelected) {
      onFilterChange({
        ...filter,
        selectedGroups: filter.selectedGroups.filter((g) => !groupIds.includes(g)),
      })
    } else {
      const newGroups = [...new Set([...filter.selectedGroups, ...groupIds])]
      onFilterChange({ ...filter, selectedGroups: newGroups })
    }
  }

  const resetFilters = () => {
    onFilterChange({ selectedGroups: [], minLength: 1, maxLength: 10 })
  }

  const GroupSection = ({ title, groups }: { title: string; groups: typeof relevantGroups }) => {
    if (groups.length === 0) return null
    const allSelected = groups.every((g) => filter.selectedGroups.includes(g.id))

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selectAll(groups)}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => toggleGroup(group.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                filter.selectedGroups.includes(group.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-muted-foreground border-border/50 hover:bg-secondary hover:text-foreground",
              )}
            >
              <span className="mr-1.5">{group.labelJp}</span>
              <span className="opacity-70">{group.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="bg-transparent border-border/50 hover:bg-secondary/50"
      >
        <Settings className="w-4 h-4 mr-2" />
        Settings
      </Button>
    )
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Practice Settings</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Word Length */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Word Length</h4>
            <span className="text-sm text-muted-foreground tabular-nums">
              {filter.minLength} - {filter.maxLength} characters
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

        {/* Character Groups */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Character Groups</h4>
            {filter.selectedGroups.length > 0 && (
              <span className="text-xs text-primary">{filter.selectedGroups.length} selected</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Select which character rows to include. Leave empty for all.</p>

          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
            {(mode === "hiragana" || mode === "both") && (
              <div className="space-y-4">
                {mode === "both" && (
                  <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
                    Hiragana ひらがな
                  </h3>
                )}
                <GroupSection title="All Hiragana groups" groups={groupsByType.hiragana} />
              </div>
            )}

            {(mode === "katakana" || mode === "both") && (
              <div className="space-y-4">
                {mode === "both" && (
                  <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2 mt-6">
                    Katakana カタカナ
                  </h3>
                )}
                <GroupSection title="All Katakana groups" groups={groupsByType.katakana} />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
