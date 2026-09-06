"use client"

import { useSyncExternalStore } from "react"
import { isMobileDevice } from "@/lib/japanese/wordsets"

function subscribe(notify: () => void) {
    const query = window.matchMedia("(max-width: 768px)")
    query.addEventListener?.("change", notify)
    return () => query.removeEventListener?.("change", notify)
}
const serverSnapshot = () => null

export function useMobileDevice() {
    return useSyncExternalStore<boolean | null>(subscribe, isMobileDevice, serverSnapshot)
}
