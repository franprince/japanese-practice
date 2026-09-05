"use client"

import { useCallback, useState, useSyncExternalStore } from "react"

const preferenceEvent = "kana-words-preference"

// Storage is the external source; a failed write stays usable in this provider.
export function useStoredPreference<T extends string>(key: string, fallback: T, valid: (value: string | null) => value is T) {
    const [override, setOverride] = useState<T | null>(null)
    const subscribe = useCallback((notify: () => void) => {
        const onStorage = (event: StorageEvent) => {
            if (event.key === key || event.key === null) notify()
        }
        const onPreference = (event: Event) => {
            if ((event as CustomEvent<string>).detail === key) notify()
        }
        window.addEventListener("storage", onStorage)
        window.addEventListener(preferenceEvent, onPreference)
        return () => {
            window.removeEventListener("storage", onStorage)
            window.removeEventListener(preferenceEvent, onPreference)
        }
    }, [key])
    const snapshot = useCallback(() => {
        if (override !== null) return override
        try {
            const saved = localStorage.getItem(key)
            return valid(saved) ? saved : fallback
        } catch { return fallback }
    }, [key, fallback, valid, override])
    const serverSnapshot = useCallback(() => fallback, [fallback])
    const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
    const setValue = useCallback((next: T) => {
        try {
            localStorage.setItem(key, next)
            setOverride(null)
            window.dispatchEvent(new CustomEvent(preferenceEvent, { detail: key }))
        } catch { setOverride(next) }
    }, [key])
    return [value, setValue] as const
}
