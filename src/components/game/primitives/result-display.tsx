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

/**
 * Show correct/incorrect feedback with answer details
 * Displays expected answer, user answer, and optional additional information
 */
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
            className={cn(
                "p-4 rounded-xl border transition-all",
                isCorrect ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30",
                className
            )}
        >
            <div className="space-y-3">
                {/* Correct/Incorrect indicator */}
                <div className="flex items-center gap-2">
                    {isCorrect ? (
                        <Check className="w-5 h-5 text-green-500" />
                    ) : (
                        <X className="w-5 h-5 text-red-500" />
                    )}
                    <span className={cn("font-medium", isCorrect ? "text-green-500" : "text-red-500")}>
                        {isCorrect ? t("correct") : t("incorrect")}
                    </span>
                </div>

                {/* Answer comparison */}
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t("correctAnswer")}:</span>
                        <div className="text-right">
                            <p className="font-bold text-foreground">{expectedAnswer}</p>
                            {romaji && <p className="text-xs text-muted-foreground">{romaji}</p>}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t("yourAnswer")}:</span>
                        <span className={cn("font-bold", isCorrect ? "text-green-500" : "text-red-500")}>
                            {userAnswer || "—"}
                        </span>
                    </div>
                </div>

                {/* Additional info (e.g., kanji meaning, reading) */}
                {additionalInfo && <div className="pt-2 border-t border-border/50">{additionalInfo}</div>}
            </div>
        </div>
    )
}
