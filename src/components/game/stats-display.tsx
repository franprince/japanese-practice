import { cn } from "@/lib/core"
import { useI18n } from "@/lib/i18n"
interface StatsDisplayProps { score: number; streak: number; bestStreak: number; remainingLabel?: string | null }
const kanjiLabels = { score: "得点", streak: "連続", best: "最高" } as const
export function StatsDisplay({ score, streak, bestStreak, remainingLabel }: StatsDisplayProps) {
  const { t } = useI18n()
  return <div data-testid="stats-display" className="stats-display border-t pt-4 text-muted-foreground">
    {remainingLabel && <span className="sr-only">{remainingLabel}</span>}
    <div className="grid grid-cols-3 gap-3 text-center">
      {([["score", score], ["streak", streak], ["best", bestStreak]] as const).map(([label, value]) => <div key={label} className={cn("stat-box", label === "streak" && "stat-box--accent")}>
        <p className="font-hand text-lg font-semibold tabular-nums text-foreground">{value}</p>
        <p className="text-sm"><span lang="ja" aria-hidden="true" className="notebook-only mr-1 font-bold">{kanjiLabels[label]}</span>{t(label)}</p>
      </div>)}
    </div>
  </div>
}
