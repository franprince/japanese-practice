"use client"
import { useRef, useState } from "react"
import { useI18n } from "@/lib/i18n"
import type { GameMode, WordsGameType } from "@/types/game"
import type { WordFilter, CharacterGroup } from "@/lib/japanese/words"
import { ModeSection } from "./settings/mode-section"
import { SessionSection } from "@/components/game/session-settings-section"
import { FilterSection } from "./settings/filter-section"
import { PracticeSettingsDialog } from "@/components/game/practice-settings-dialog"
interface WordsSettingsOverlayProps {
  open: boolean; onOpenChange: (open: boolean) => void
  mode: GameMode; gameType: WordsGameType; playMode: "infinite" | "session"; targetCount: number; filter: WordFilter
  onApply: (mode: GameMode, gameType: WordsGameType, playMode: "infinite" | "session", targetCount: number, filter: WordFilter) => void
  characterGroups: CharacterGroup[]
}
export function WordsSettingsOverlay(props: WordsSettingsOverlayProps) {
  return props.open ? <WordsSettingsDraft {...props} /> : null
}
function WordsSettingsDraft({ onOpenChange, mode, gameType, playMode, targetCount, filter, onApply, characterGroups }: WordsSettingsOverlayProps) {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const [localMode, setLocalMode] = useState(mode)
  const [localGameType, setLocalGameType] = useState(gameType)
  const [localPlayMode, setLocalPlayMode] = useState(playMode)
  const [localTargetCount, setLocalTargetCount] = useState(targetCount)
  const [localFilter, setLocalFilter] = useState(filter)
  const changed = JSON.stringify([localMode, localGameType, localPlayMode, localTargetCount, localFilter]) !== JSON.stringify([mode, gameType, playMode, targetCount, filter])
  return <PracticeSettingsDialog open onOpenChange={onOpenChange} changed={changed} invalid={localMode === "custom" && !localFilter.selectedGroups.length} onApply={() => {
    onApply(localMode, localGameType, localPlayMode, localTargetCount, localFilter); onOpenChange(false)
  }}>
    <ModeSection mode={localMode} gameType={localGameType} onModeChange={setLocalMode} onGameTypeChange={setLocalGameType} />
    {localGameType === "words" && <p className="text-sm text-muted-foreground">{t("practice.downloadHint")}</p>}
    <SessionSection playMode={localPlayMode} targetCount={localTargetCount} onPlayModeChange={setLocalPlayMode} onTargetCountChange={setLocalTargetCount} />
    {localMode === "custom" && <section className="space-y-3"><h2 className="font-semibold">{t("practice.advanced")}</h2>
      <FilterSection mode={localMode} gameType={localGameType} filter={localFilter} characterGroups={characterGroups} onFilterChange={setLocalFilter} sectionRef={ref} />
    </section>}
  </PracticeSettingsDialog>
}
