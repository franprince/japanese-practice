"use client"

import { Button } from "@/components/ui/button"
import { Trophy, Medal, ThumbsUp, Frown } from "lucide-react"
import { useConfetti } from "@/hooks/use-confetti"

interface SessionSummaryCardProps {
  title: string
  targetLabel: string
  correctLabel: string
  accuracyLabel: string
  targetCount: number
  correctCount: number
  accuracy: number
  onRestart: () => void
  onSwitchToInfinite: () => void
  restartLabel: string
  switchLabel: string
}

// Confetti component logic moved to hook

export function SessionSummaryCard({
  title,
  targetLabel,
  correctLabel,
  accuracyLabel,
  targetCount,
  correctCount,
  accuracy,
  onRestart,
  onSwitchToInfinite,
  restartLabel,
  switchLabel,
}: SessionSummaryCardProps) {

  let Icon = ThumbsUp
  let colorClass = "text-primary"
  let bgClass = "bg-primary/10 border-primary/20"
  let animationClass = "animate-in fade-in zoom-in duration-500"

  const confetti = useConfetti()

  if (accuracy >= 90) {
    Icon = Trophy
    colorClass = "text-yellow-500"
    bgClass = "bg-yellow-500/10 border-yellow-500/30"
    animationClass = "animate-in zoom-in-50 spin-in-3 duration-700"
  } else if (accuracy >= 80) {
    Icon = Medal
    colorClass = "text-green-500"
    bgClass = "bg-green-500/10 border-green-500/30"
    animationClass = "animate-in slide-in-from-bottom-4 duration-500"
  } else if (accuracy < 50) {
    Icon = Frown
    colorClass = "text-destructive"
    bgClass = "bg-destructive/10 border-destructive/30"
    animationClass = "animate-in shake duration-500"
  }

  return (
    <div className={`rounded-2xl border p-8 shadow-lg space-y-6 text-center transition-all relative overflow-hidden ${bgClass} ${animationClass}`}>
      {accuracy >= 80 && confetti}

      <div className="flex flex-col items-center gap-4 relative z-10">
        <div className={`p-4 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 shadow-sm ${colorClass}`}>
          <Icon className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
          <div className="flex justify-center gap-4 text-sm font-medium text-muted-foreground">
            <span>{targetCount} {targetLabel}</span>
            <span className="text-border">|</span>
            <span className={accuracy >= 80 ? "text-green-500" : ""}>{accuracy}% {accuracyLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 relative z-10">
        <Button size="lg" className="cursor-pointer font-bold shadow-md hover:scale-105 transition-transform" onClick={onRestart}>
          {restartLabel}
        </Button>
        <Button variant="outline" size="lg" className="cursor-pointer hover:bg-background/80" onClick={onSwitchToInfinite}>
          {switchLabel}
        </Button>
      </div>
    </div>
  )
}
