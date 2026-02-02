"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { updateWordset } from "@/lib/japanese/words/loader"

export function useWordsetUpdate() {
    useEffect(() => {
        const handleUpdateAvailable = (event: Event) => {
            const customEvent = event as CustomEvent<{ lang: string }>
            console.log("[Verificator] Update available (Mobile)", customEvent.detail)

            toast("Update Available", {
                description: "A new version of the dictionary is available.",
                action: {
                    label: "Download",
                    onClick: () => {
                        toast.promise(updateWordset(customEvent.detail.lang), {
                            loading: 'Downloading update...',
                            success: 'Download complete! Refreshing...',
                            error: 'Failed to download update',
                        })
                    }
                },
                duration: 10000,
            })
        }

        const handleUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{ lang: string }>
            console.log("[Verificator] Wordset updated", customEvent.detail)

            toast("New content ready", {
                description: "Refresh to apply changes.",
                action: {
                    label: "Refresh",
                    onClick: () => window.location.reload(),
                },
                duration: Infinity,
            })
        }

        window.addEventListener("WORDSET_UPDATE_AVAILABLE", handleUpdateAvailable)
        window.addEventListener("WORDSET_UPDATED", handleUpdated)

        return () => {
            window.removeEventListener("WORDSET_UPDATE_AVAILABLE", handleUpdateAvailable)
            window.removeEventListener("WORDSET_UPDATED", handleUpdated)
        }
    }, [])
}
