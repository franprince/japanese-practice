"use client"

import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Settings2 } from "lucide-react"
import { cn } from "@/lib/core"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import type { GameMode, WordsGameType } from "@/types/game"
import type { WordFilter, CharacterGroup } from "@/lib/japanese/words"
import { ModeSection } from "./settings/mode-section"
import { SessionSection } from "./settings/session-section"
import { FilterSection } from "./settings/filter-section"

interface WordsSettingsOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: GameMode
  gameType: WordsGameType
  playMode: "infinite" | "session"
  targetCount: number
  filter: WordFilter
  onApply: (mode: GameMode, gameType: WordsGameType, playMode: "infinite" | "session", targetCount: number, filter: WordFilter) => void
  characterGroups: CharacterGroup[]
}

export function WordsSettingsOverlay(props: WordsSettingsOverlayProps) {
  return <Dialog.Root open={props.open} onOpenChange={props.onOpenChange}>{props.open && <WordsSettingsDraft {...props} />}</Dialog.Root>
}

// Owns the single editable draft and coordinates dialog lifecycle and custom scrolling.
function WordsSettingsDraft({ onOpenChange, mode, gameType, playMode, targetCount, filter, onApply, characterGroups }: WordsSettingsOverlayProps) {
  const { t } = useI18n()
  const customSectionRef = React.useRef<HTMLDivElement>(null)
  const shouldScroll = React.useRef(false)
  const [localMode, setLocalMode] = React.useState<GameMode>(mode)
  const [localGameType, setLocalGameType] = React.useState<WordsGameType>(gameType)
  const [localPlayMode, setLocalPlayMode] = React.useState<"infinite" | "session">(playMode)
  const [localTargetCount, setLocalTargetCount] = React.useState(targetCount)
  const [localFilter, setLocalFilter] = React.useState<WordFilter>(filter)

  React.useEffect(() => {
    if (localMode === "custom" && shouldScroll.current) {
      customSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      shouldScroll.current = false
    }
  }, [localMode])

  const handleModeChange = (nextMode: GameMode) => {
    setLocalMode(nextMode)
    if (nextMode === "custom") shouldScroll.current = true
  }
  const handleApply = () => {
    onOpenChange(false)
    onApply(localMode, localGameType, localPlayMode, localTargetCount, localFilter)
  }

  return (
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" />
        <Dialog.Content className={cn(
          "fixed z-[101] bg-card/95 backdrop-blur-2xl border border-primary/20 shadow-2xl flex flex-col overflow-hidden transition-all duration-500",
          // Mobile: Bottom Sheet
          "inset-x-0 bottom-0 top-auto rounded-t-[2.5rem] border-b-0 max-h-[92vh] animate-in slide-in-from-bottom duration-500 ease-out",
          // Desktop: Centered Modal
          "md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[700px] md:max-h-[85vh] md:rounded-[2.5rem] md:border-b md:zoom-in-95 md:slide-in-from-bottom-0"
        )}>
          {/* Mobile Drag Handle */}
          <div className="w-12 h-1.5 bg-foreground/10 rounded-full mx-auto mt-4 mb-2 md:hidden shrink-0" />

          <div className="p-6 md:p-8 flex items-center justify-between border-b border-border/20 shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                <Settings2 className="w-6 h-6" />
              </div>
              <div>
                <Dialog.Title className="text-xl md:text-2xl font-black tracking-tight uppercase">
                  {t("practiceSettings") || "Command Center"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                  {t("settings.subtitle") || "Configure your learning experience"}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar">

            <ModeSection
              mode={localMode}
              gameType={localGameType}
              onModeChange={handleModeChange}
              onGameTypeChange={setLocalGameType}
            />
            <SessionSection
              playMode={localPlayMode}
              targetCount={localTargetCount}
              onPlayModeChange={setLocalPlayMode}
              onTargetCountChange={setLocalTargetCount}
            />
            <FilterSection
              mode={localMode}
              gameType={localGameType}
              filter={localFilter}
              characterGroups={characterGroups}
              onFilterChange={setLocalFilter}
              sectionRef={customSectionRef}
            />

            {localMode !== "custom" && (
              <div className="p-4 rounded-3xl bg-primary/5 border border-primary/20">
                <p className="text-[10px] text-muted-foreground leading-relaxed leading-relaxed font-medium">
                  {t("settings.customHint") || "Select \"Custom\" if you want to filter by specific word length or character groups."}
                </p>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 flex items-center justify-center gap-4 bg-background/40 border-t border-border/20 shrink-0">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full font-black uppercase tracking-widest text-[10px] h-14"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              onClick={handleApply}
              disabled={localMode === "custom" && localFilter.selectedGroups.length === 0}
              className="flex-[2] rounded-full font-black uppercase tracking-widest text-[10px] h-14 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
            >
              {t("settings.saveSettings") || "Save Settings"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
  )
}
