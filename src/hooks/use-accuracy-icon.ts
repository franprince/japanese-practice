import { Trophy, Medal, ThumbsUp, Frown } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface AccuracyIconResult {
    Icon: LucideIcon
    colorClass: string
    bgClass: string
    animationClass: string
}

export function useAccuracyIcon(accuracy: number): AccuracyIconResult {
    if (accuracy >= 90) {
        return {
            Icon: Trophy,
            colorClass: "text-yellow-500",
            bgClass: "bg-yellow-500/10 border-yellow-500/30",
            animationClass: "animate-in zoom-in-50 spin-in-3 duration-700",
        }
    }

    if (accuracy >= 80) {
        return {
            Icon: Medal,
            colorClass: "text-green-500",
            bgClass: "bg-green-500/10 border-green-500/30",
            animationClass: "animate-in slide-in-from-bottom-4 duration-500",
        }
    }

    if (accuracy < 50) {
        return {
            Icon: Frown,
            colorClass: "text-destructive",
            bgClass: "bg-destructive/10 border-destructive/30",
            animationClass: "animate-in shake duration-500",
        }
    }

    // Default: 50-79%
    return {
        Icon: ThumbsUp,
        colorClass: "text-primary",
        bgClass: "bg-primary/10 border-primary/20",
        animationClass: "animate-in fade-in zoom-in duration-500",
    }
}
