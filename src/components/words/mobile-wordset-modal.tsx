"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface MobileWordsetModalProps {
    open: boolean
    title: string
    message: string
    progress: number | null
    onCancel: () => void
    onConfirm: () => void
    confirmDisabled?: boolean
    cancelDisabled?: boolean
    confirmLabel: string
    cancelLabel: string
}

export function MobileWordsetModal({
    open,
    title,
    message,
    progress,
    onCancel,
    onConfirm,
    confirmDisabled = false,
    cancelDisabled = false,
    confirmLabel,
    cancelLabel,
}: MobileWordsetModalProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <Card className="w-full max-w-sm border-border/50 bg-card/95 backdrop-blur-sm shadow-lg">
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">{title}</p>
                        <p className="text-sm text-muted-foreground">{message}</p>
                    </div>
                    {progress !== null && (
                        <div className="space-y-2">
                            <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-[width] duration-200"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground text-right tabular-nums">{progress}%</p>
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={onCancel}
                            className="h-9"
                            disabled={cancelDisabled}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            className="h-9"
                            disabled={confirmDisabled}
                        >
                            {confirmLabel}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
