"use client"
import { useState, type ReactNode } from "react"
import { PracticeSettingsDialog, PracticeSettingsTrigger } from "./practice-settings-dialog"
import { SessionSection } from "@/components/game/session-settings-section"
import type { CommonPracticeSettings } from "@/lib/practice-preferences"

export function PracticeSettings<Settings extends CommonPracticeSettings>({ settings, onApply, children }: {
  settings: Settings
  onApply: (settings: Settings) => void
  children: (draft: Settings, update: (next: Partial<Settings>) => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  return <><PracticeSettingsTrigger onClick={() => setOpen(true)} />
    {open && <SettingsDraft settings={settings} onApply={onApply} onClose={() => setOpen(false)}>{children}</SettingsDraft>}
  </>
}
function SettingsDraft<Settings extends CommonPracticeSettings>({ settings, onApply, onClose, children }: {
  settings: Settings
  onApply: (settings: Settings) => void
  onClose: () => void
  children: (draft: Settings, update: (next: Partial<Settings>) => void) => ReactNode
}) {
  const [draft, setDraft] = useState(settings)
  const update = (next: Partial<Settings>) => setDraft(previous => ({ ...previous, ...next }))
  const changed = JSON.stringify(draft) !== JSON.stringify(settings)
  return <PracticeSettingsDialog
    open
    onOpenChange={onClose}
    changed={changed}
    onApply={() => { if (changed) onApply(draft); onClose() }}
  >
    {children(draft, update)}
    <SessionSection
      playMode={draft.playMode}
      targetCount={draft.targetCount}
      onPlayModeChange={playMode => update({ playMode } as Partial<Settings>)}
      onTargetCountChange={targetCount => update({ targetCount } as Partial<Settings>)}
    />
  </PracticeSettingsDialog>
}
