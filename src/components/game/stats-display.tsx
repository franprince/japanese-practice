import { useI18n } from "@/lib/i18n"
interface StatsDisplayProps { score: number; streak: number; bestStreak: number; remainingLabel?: string | null }
export function StatsDisplay({ score, streak, bestStreak, remainingLabel }: StatsDisplayProps) {
  const { t } = useI18n()
  return <div data-testid="stats-display" className="border-t pt-4 text-muted-foreground">
    {remainingLabel && <span className="sr-only">{remainingLabel}</span>}
    <div className="grid grid-cols-3 gap-3 text-center">
      {[["score", score], ["streak", streak], ["best", bestStreak]].map(([label, value]) => <div key={label}>
        <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p><p className="text-sm">{t(label as "score" | "streak" | "best")}</p>
      </div>)}
    </div>
  </div>
}
