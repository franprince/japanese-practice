import { useCallback, useEffect, useState } from "react"
import { useStoredPreference } from "./use-stored-preference"
import { isPracticeSettings, practiceDefaults, practiceKey, type PracticeKind, type PracticeSettingsByKind } from "@/lib/practice-preferences"

export function usePracticePreferences<Kind extends PracticeKind>(kind: Kind, initialOverride?: PracticeSettingsByKind[Kind]) {
  const valid = useCallback((value: string | null): value is string => {
    try { return value !== null && isPracticeSettings(kind, JSON.parse(value)) } catch { return false }
  }, [kind])
  const [stored, setStored] = useStoredPreference(practiceKey(kind), JSON.stringify(practiceDefaults[kind]), valid)
  // Another tab's preference edits must not silently reconfigure an active session.
  const [settings, setSettings] = useState<PracticeSettingsByKind[Kind]>(() => initialOverride ?? JSON.parse(stored))
  const save = useCallback((value: PracticeSettingsByKind[Kind]) => { setSettings(value); setStored(JSON.stringify(value)) }, [setStored])
  useEffect(() => {
    if (initialOverride) setStored(JSON.stringify(initialOverride))
    try { localStorage.setItem("practice-last", kind) } catch { /* Practice remains usable without storage. */ }
  }, [kind, initialOverride, setStored])
  return [settings, save] as const
}
