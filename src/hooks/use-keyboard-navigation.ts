"use client"

import { useEffect } from "react"

export interface KeyboardHandlers {
    onEnter?: () => void
    onEscape?: () => void
    onBackspace?: () => void
}


export function useKeyboardNavigation(
    handlers: KeyboardHandlers,
    enabled = true
) {
    useEffect(() => {
        if (!enabled) return

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null
            if (e.defaultPrevented || target?.closest("[role=dialog], button, a, select, summary") || e.isComposing) return
            // Native editing must retain selection, caret and IME behavior.
            if ((e.key === "Backspace" || e.key === "Escape") && target?.matches("input, textarea, [contenteditable=true]")) return
            if (e.key === "Enter" && handlers.onEnter) {
                e.preventDefault()
                handlers.onEnter()
            }
            if (e.key === "Escape" && handlers.onEscape) {
                handlers.onEscape()
            }
            if (e.key === "Backspace" && handlers.onBackspace) {
                handlers.onBackspace()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [handlers, enabled])
}
