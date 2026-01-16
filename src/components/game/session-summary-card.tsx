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
  /** Characters the user got wrong, with occurrence count and romaji */
  incorrectChars?: Map<string, { count: number; romaji: string }>
  /** Label for the incorrect chars section */
  incorrectCharsLabel?: string
  /** Table header for character column */
  tableCharacterLabel?: string
  /** Table header for errors column */
  tableErrorsLabel?: string
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
  incorrectChars,
  incorrectCharsLabel = "Characters to practice",
  tableCharacterLabel = "Character",
  tableErrorsLabel = "Errors",
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

  // Sort incorrect chars by occurrence count (highest first), show top 3
  // Handle both old format (number) and new format ({ count, romaji })
  const sortedIncorrectChars = incorrectChars
    ? Array.from(incorrectChars.entries())
      .sort(([, a], [, b]) => {
        const countA = typeof a === 'object' ? a.count : (typeof a === 'number' ? a : 0)
        const countB = typeof b === 'object' ? b.count : (typeof b === 'number' ? b : 0)
        return countB - countA
      })
      .slice(0, 3)
    : []

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
      {sortedIncorrectChars.length > 0 && (
        <div className="relative z-10 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">{incorrectCharsLabel}</p>
          <div className="max-h-40 overflow-y-auto mx-auto max-w-xs">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase">
                  <th className="py-1 text-left pl-4">{tableCharacterLabel}</th>
                  <th className="py-1 text-right pr-4">{tableErrorsLabel}</th>
                </tr>
              </thead>
              <tbody>
                {sortedIncorrectChars.map(([kana, data]) => {
                  const count = typeof data === 'object' ? data.count : (typeof data === 'number' ? data : 1)
                  const romaji = typeof data === 'object' ? data.romaji : ''
                  return (
                    <tr key={kana} className="border-t border-border/20">
                      <td className="py-2 text-left pl-4 font-mono text-lg text-destructive">
                        {kana} {romaji && <span className="text-sm opacity-70">({romaji})</span>}
                      </td>
                      <td className="py-2 text-right pr-4 tabular-nums text-muted-foreground">×{count}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
