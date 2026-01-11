import { Button } from "@/components/ui/button"

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
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm space-y-4 text-center">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">
        {targetLabel}: {targetCount} • {correctLabel}: {correctCount} • {accuracyLabel}: {accuracy}%
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button className="cursor-pointer" onClick={onRestart}>
          {restartLabel}
        </Button>
        <Button variant="secondary" className="cursor-pointer" onClick={onSwitchToInfinite}>
          {switchLabel}
        </Button>
      </div>
    </div>
  )
}
