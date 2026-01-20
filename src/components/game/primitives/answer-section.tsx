"use client"

import type React from "react"
import { cn } from "@/lib/core"

interface AnswerSectionProps {
    children: React.ReactNode
    className?: string
}

/**
 * Container for answer input area
 * Provides consistent spacing and layout for input fields, keypads, or option lists
 */
export function AnswerSection({ children, className }: AnswerSectionProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {children}
        </div>
    )
}
