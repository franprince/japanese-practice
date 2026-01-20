"use client"

import { useEffect } from "react"

/**
 * Performance monitoring component that adds custom INP logging
 * for debugging production performance issues.
 * 
 * Logs are sent to:
 * - Browser console (development & production)
 * - Vercel server logs via API (production only)
 */
export function PerformanceMonitor() {
    useEffect(() => {
        if (typeof window === "undefined") return

        // Add performance observer for long tasks (potential INP issues)
        if ("PerformanceObserver" in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) {
                            const logData = {
                                duration: `${entry.duration}ms`,
                                name: entry.name,
                                startTime: entry.startTime,
                            }

                            console.warn("⚠️ Long Task detected:", logData)

                            // Send to server for Vercel logging (production only)
                            if (process.env.NODE_ENV === "production") {
                                fetch("/api/log-performance", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        type: "long-task",
                                        duration: entry.duration,
                                        name: entry.name,
                                    }),
                                }).catch(() => {
                                    // Silent fail - don't block user experience
                                })
                            }
                        }
                    }
                })

                observer.observe({ entryTypes: ["longtask", "measure"] })

                return () => observer.disconnect()
            } catch (error) {
                console.error("Failed to setup PerformanceObserver:", error)
            }
        }
    }, [])

    return null
}
