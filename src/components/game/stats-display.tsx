import { Flame, Trophy, Target } from "lucide-react"
import { useI18n } from "@/lib/i18n"

interface StatsDisplayProps {
  score: number
  streak: number
  bestStreak: number
}

export function StatsDisplay({ score, streak, bestStreak }: StatsDisplayProps) {
  const { t } = useI18n()

  return (
    <div className="flex items-center justify-center gap-8 md:gap-12 w-full max-w-lg mx-auto py-4">
      <div className="flex flex-col items-center gap-1">
        <Trophy className="w-5 h-5 text-primary" />
        <p className="text-2xl font-bold tabular-nums">{score}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("score")}</p>
      </div>
      <div className="h-8 w-px bg-border/50" />
      <div className="flex flex-col items-center gap-1">
        <Flame className="w-5 h-5 text-accent" />
        <p className="text-2xl font-bold tabular-nums">{streak}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("streak")}</p>
      </div>
      <div className="h-8 w-px bg-border/50" />
      <div className="flex flex-col items-center gap-1">
        <Target className="w-5 h-5 text-muted-foreground" />
        <p className="text-2xl font-bold tabular-nums">{bestStreak}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("best")}</p>
      </div>
    </div>
  )
}
