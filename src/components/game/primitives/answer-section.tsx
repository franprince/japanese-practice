"use client"

import type React from "react"
import { cn } from "@/lib/core"

interface AnswerSectionProps {
    children: React.ReactNode
    className?: string
}


export function AnswerSection({ children, className }: AnswerSectionProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {children}
        </div>
    )
}
