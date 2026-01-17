"use client"

import { Button } from "@/components/ui/button"
import { useConfetti } from "@/hooks/use-confetti"
import { useAccuracyIcon } from "@/hooks/use-accuracy-icon"
import { IncorrectCharsTable } from "./incorrect-chars-table"

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
  /** Characters the user got wrong, with occurrence count and romaji */
  incorrectChars?: Map<string, { count: number; romaji: string }>
  /** Label for the incorrect chars section */
  incorrectCharsLabel?: string
  /** Table header for character column */
  tableCharacterLabel?: string
  /** Table header for errors column */
  tableErrorsLabel?: string
}

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
  incorrectChars,
  incorrectCharsLabel = "Characters to practice",
  tableCharacterLabel = "Character",
  tableErrorsLabel = "Errors",
}: SessionSummaryCardProps) {
  const confetti = useConfetti()
  const { Icon, colorClass, bgClass, animationClass } = useAccuracyIcon(accuracy)

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

      {/* Incorrect characters table */}
      {incorrectChars && incorrectChars.size > 0 && (
        <div className="relative z-10 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">{incorrectCharsLabel}</p>
          <IncorrectCharsTable
            incorrectChars={incorrectChars}
            tableCharacterLabel={tableCharacterLabel}
            tableErrorsLabel={tableErrorsLabel}
            maxItems={3}
          />
        </div>
      )}

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
