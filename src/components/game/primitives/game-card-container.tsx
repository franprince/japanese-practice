"use client"

import type React from "react"
import { cn } from "@/lib/core"

interface GameCardContainerProps {
    feedback: "correct" | "incorrect" | null
    children: React.ReactNode
    className?: string
}

/**
 * Card container with feedback-based styling
 * Provides visual feedback through border colors and shadows
 */
export function GameCardContainer({ feedback, children, className }: GameCardContainerProps) {
    return (
        <div
            className={cn(
                "relative rounded-2xl border-2 bg-card p-6 md:p-8 transition-all duration-300",
                feedback === "correct" && "border-green-500/50 shadow-lg shadow-green-500/10",
                feedback === "incorrect" && "border-red-500/50 shadow-lg shadow-red-500/10",
                !feedback && "border-border",
                className
            )}
        >
            {children}
        </div>
    )
}
