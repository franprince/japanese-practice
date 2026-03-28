"use client"

import type React from "react"
import { cn } from "@/lib/core"

interface GameCardContainerProps {
    feedback: "correct" | "incorrect" | null
    children: React.ReactNode
    className?: string
}


export function GameCardContainer({ feedback, children, className }: GameCardContainerProps) {
    return (
        <div
            className={cn(
                "relative rounded-[2rem] border-2 bg-card/40 backdrop-blur-2xl p-8 md:p-12 transition-all duration-500 glass-card",
                feedback === "correct" && "border-success/50 shadow-[0_0_40px_rgba(var(--success),0.15)] scale-[1.01]",
                feedback === "incorrect" && "border-destructive/50 shadow-[0_0_40px_rgba(var(--destructive),0.15)] animate-shake",
                !feedback && "border-border/40 shadow-2xl",
                className
            )}
        >
            {/* Inner Glow */}
            <div className={cn(
                "absolute inset-0 rounded-[2rem] pointer-events-none transition-opacity duration-500 opacity-0",
                feedback === "correct" && "bg-success/5 opacity-100",
                feedback === "incorrect" && "bg-destructive/5 opacity-100"
            )} />
            
            <div className="relative z-10">
                {children}
            </div>
        </div>
    )
}
