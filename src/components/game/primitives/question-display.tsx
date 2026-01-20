"use client"

import type React from "react"
import { cn } from "@/lib/core"
import { getResponsiveFontSize } from "@/lib/core"

interface QuestionDisplayProps {
    value: string
    prompt?: string
    lang?: "ja" | "en" | "es"
    icon?: React.ReactNode
    className?: string
}

/**
 * Display question text with responsive sizing
 * Automatically adjusts font size based on text length
 */
export function QuestionDisplay({ value, prompt, lang, icon, className }: QuestionDisplayProps) {
    return (
        <div className={cn("text-center mb-6", className)}>
            {/* Prompt label with optional icon */}
            {(prompt || icon) && (
                <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground text-sm">
                    {icon}
                    {prompt && <span>{prompt}</span>}
                </div>
            )}

            {/* Question text with responsive sizing */}
            <div
                data-testid="question-display"
                lang={lang}
                className={cn(
                    "font-bold text-foreground transition-all whitespace-nowrap",
                    getResponsiveFontSize(value)
                )}
            >
                {value}
            </div>
        </div>
    )
}
