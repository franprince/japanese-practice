"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/core"

interface QuestionDisplayProps {
    value: string
    prompt?: string
    icon?: ReactNode
    lang?: "ja" | "en" | "es"
    className?: string
}

export function QuestionDisplay({ value, prompt, icon, lang, className }: QuestionDisplayProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[120px] md:min-h-[200px] mb-2 md:mb-12 relative", className)}>
            {(icon || prompt) && (
                <div className="flex flex-col items-center gap-2 mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    {icon && (
                        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                            {icon}
                        </div>
                    )}
                    {prompt && (
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                            {prompt}
                        </p>
                    )}
                </div>
            )}

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
            <div className="mt-4 w-24 h-1.5 bg-primary/20 rounded-full blur-md animate-pulse" />
        </div>
    )
}
