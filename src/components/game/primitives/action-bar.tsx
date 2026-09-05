"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Check, SkipForward } from "lucide-react"
import type { TranslationKey } from "@/lib/i18n"

interface ActionBarProps {
    showResult: boolean
    onSubmit?: () => void
    onNext?: () => void
    onSkip?: () => void
    submitDisabled?: boolean
    nextDisabled?: boolean
    skipDisabled?: boolean
    submitLabel?: string
    nextLabel?: string
    skipLabel?: string
    t: (key: TranslationKey) => string
}


export function ActionBar({
    showResult,
    onSubmit,
    onNext,
    onSkip,
    submitDisabled = false,
    nextDisabled = false,
    skipDisabled = false,
    submitLabel,
    nextLabel,
    skipLabel,
    t,
}: ActionBarProps) {
    if (showResult) {
        
        return (
            <div className="flex justify-center pt-2">
                <Button
                    onClick={onNext}
                    className="min-h-11 w-full bg-primary hover:bg-primary/90"
                    disabled={nextDisabled}
                >
                    {nextLabel || t("common.next")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        )
    }

    
    return (
        <div className="flex gap-3 pt-2">
            {onSkip && (
                <Button
                    variant="outline"
                    onClick={onSkip}
                    disabled={skipDisabled}
                    className="min-h-11 flex-1 bg-transparent border-border/50 hover:bg-secondary/50"
                >
                    <SkipForward className="w-4 h-4 mr-2" />
                    {skipLabel || t("skip")}
                </Button>
            )}
            {onSubmit && (
                <Button
                    onClick={onSubmit}
                    className="min-h-11 flex-[2] bg-primary hover:bg-primary/90"
                    disabled={submitDisabled}
                >
                    {submitLabel || t("check")}
                    <Check className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
