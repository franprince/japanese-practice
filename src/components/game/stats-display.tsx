import { cn } from "@/lib/core"
import { useI18n } from "@/lib/i18n"
interface StatsDisplayProps { score: number; streak: number; bestStreak: number; remainingLabel?: string | null }
const kanjiLabels = { score: "得点", streak: "連続", best: "最高" } as const
export function StatsDisplay({ score, streak, bestStreak, remainingLabel }: StatsDisplayProps) {
  const { t } = useI18n()
  return <div data-testid="stats-display" className="stats-display text-muted-foreground">
    {remainingLabel && <span className="sr-only">{remainingLabel}</span>}
    <div className="grid grid-cols-3 gap-2.5 text-center">
      {([["score", score], ["streak", streak], ["best", bestStreak]] as const).map(([label, value]) => <div key={label} className={cn("stat-box min-w-[76px] px-2.5 py-1", label === "streak" && "stat-box--accent")}>
        <p className="text-xs font-bold"><span lang="ja" aria-hidden="true" className="notebook-only mr-1">{kanjiLabels[label]} ·</span>{t(label)}</p>
        <p className="stat-value font-hand text-[28px] font-semibold leading-[1.1] tabular-nums text-foreground">{value}</p>
      </div>)}
    </div>
  </div>
}
