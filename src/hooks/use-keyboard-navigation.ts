"use client"

import { useEffect } from "react"

export interface KeyboardHandlers {
    onEnter?: () => void
    onEscape?: () => void
    onBackspace?: () => void
}

/**
 * Hook for consistent keyboard navigation across game components
 */
export function useKeyboardNavigation(
    handlers: KeyboardHandlers,
    enabled = true
) {
    useEffect(() => {
        if (!enabled) return

        const handleKeyDown = (e: KeyboardEvent) => {
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
