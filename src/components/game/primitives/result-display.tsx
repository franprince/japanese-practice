"use client"

import type React from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/core"
import type { TranslationKey } from "@/lib/i18n"

interface ResultDisplayProps {
    isCorrect: boolean
    expectedAnswer: string
    userAnswer: string
    romaji?: string
    additionalInfo?: React.ReactNode
    t: (key: TranslationKey) => string
    className?: string
}


export function ResultDisplay({
    isCorrect,
    expectedAnswer,
    userAnswer,
    romaji,
    additionalInfo,
    t,
    className,
}: ResultDisplayProps) {
    return (
        <div
            role="status" aria-live="polite" aria-atomic="true"
            className={cn(
                "p-4 rounded-xl border transition-all",
                isCorrect ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30",
                className
            )}
        >
            <div className="space-y-3">
                {}
                <div className="flex items-center gap-2">
                    {isCorrect ? (
                        <Check className="w-5 h-5 text-success" />
                    ) : (
                        <X className="w-5 h-5 text-destructive" />
                    )}
                    <span className={cn("font-medium", isCorrect ? "text-success" : "text-destructive")}>
                        {isCorrect ? t("correct") : t("incorrect")}
                    </span>
                </div>

                {}
                <div className="space-y-2 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="text-muted-foreground">{t("correctAnswer")}:</span>
                        <div className="min-w-0 break-words text-right [overflow-wrap:anywhere]">
                            <p className="font-bold text-foreground">{expectedAnswer}</p>
                            {romaji && <p className="text-xs text-muted-foreground">{romaji}</p>}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="text-muted-foreground">{t("yourAnswer")}:</span>
                        <span className={cn("min-w-0 break-all font-bold", isCorrect ? "text-success" : "text-destructive")}>
                            {userAnswer || "—"}
                        </span>
                    </div>
                </div>

                {}
                {additionalInfo && <div className="pt-2 border-t border-border/50">{additionalInfo}</div>}
            </div>
        </div>
    )
}
