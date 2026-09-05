"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { subscribeWordsetUpdates, updateWordset } from "@/lib/japanese/wordsets"

export function useWordsetUpdate() {
    useEffect(() => subscribeWordsetUpdates(event => {
        if (event.type === "diagnostic" || event.type === "revalidation-failed") {
            console.warn("Wordset diagnostic", event)
        } else if (event.type === "update-available") {
            toast("Update Available", {
                description: "A new version of the dictionary is available.",
                action: {
                    label: "Download",
                    onClick: () => {
                        toast.promise(updateWordset(event.lang), {
                            loading: "Downloading update...",
                            success: "Download complete! Refreshing...",
                            error: "Failed to download update",
                        })
                    },
                },
                duration: 10000,
            })
        } else if (event.type === "updated") {
            toast("New content ready", {
                description: "Refresh to apply changes.",
                action: { label: "Refresh", onClick: () => window.location.reload() },
                duration: Infinity,
            })
        }
    }), [])
}
