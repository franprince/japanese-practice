"use client"

import type React from "react"
import { cn } from "@/lib/core"

interface QuestionDisplayProps {
    value: string
    lang?: "ja" | "en" | "es"
    className?: string
}

export function QuestionDisplay({ value, lang, className }: QuestionDisplayProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[160px] md:min-h-[200px] mb-8 md:mb-12", className)}>
            <div 
                className={cn(
                    "font-black tracking-tighter text-foreground select-none pointer-events-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500 whitespace-nowrap px-4",
                    value.length > 8 ? "text-4xl md:text-6xl" : 
                    value.length > 5 ? "text-5xl md:text-8xl" : 
                    "text-7xl md:text-9xl"
                )} 
                lang={lang}
                data-testid="question-display"
            >
                {value}
            </div>
            {/* Base Glow */}
            <div className="mt-8 w-24 h-1.5 bg-primary/20 rounded-full blur-md animate-pulse" />
        </div>
    )
}
