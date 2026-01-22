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
    submitLabel?: string
    nextLabel?: string
    skipLabel?: string
    t: (key: TranslationKey) => string
}

/**
 * Action buttons for game card (Submit, Next, Skip)
 * Conditionally renders based on game state
 */
export function ActionBar({
    showResult,
    onSubmit,
    onNext,
    onSkip,
    submitDisabled = false,
    nextDisabled = false,
    submitLabel,
    nextLabel,
    skipLabel,
    t,
}: ActionBarProps) {
    if (showResult) {
        // Show Next button after answer is revealed
        return (
            <div className="flex justify-center pt-2">
                <Button
                    onClick={onNext}
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={nextDisabled}
                >
                    {nextLabel || t("common.next")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        )
    }

    // Show Submit and Skip buttons before answer
    return (
        <div className="flex gap-3 pt-2">
            {onSkip && (
                <Button
                    variant="outline"
                    onClick={onSkip}
                    className="flex-1 bg-transparent border-border/50 hover:bg-secondary/50"
                >
                    <SkipForward className="w-4 h-4 mr-2" />
                    {skipLabel || t("skip")}
                </Button>
            )}
            {onSubmit && (
                <Button
                    onClick={onSubmit}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={submitDisabled}
                >
                    {submitLabel || t("check")}
                    <Check className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
