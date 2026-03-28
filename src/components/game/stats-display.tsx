import { Flame, Trophy, Target } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/core"

interface StatsDisplayProps {
  score: number
  streak: number
  bestStreak: number
  remainingLabel?: string | null
}

export function StatsDisplay({ score, streak, bestStreak, remainingLabel }: StatsDisplayProps) {
  const { t } = useI18n()

  return (
    <div
      className="w-full p-6 glass-card rounded-[2rem] border-primary/20 shadow-2xl relative overflow-hidden group"
      data-testid="stats-display"
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none transition-transform group-hover:scale-110 duration-700" />
      
      {remainingLabel && (
        <div className="flex items-center justify-center mb-6">
          <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">
            {remainingLabel}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 relative z-10">
        <div className="flex flex-col items-center gap-2 group/stat">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 transition-all duration-300 group-hover/stat:scale-110 group-hover/stat:shadow-[0_0_15px_oklch(var(--primary)/0.3)]">
            <Trophy className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black tracking-tight tabular-nums text-foreground">
            {score}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t("score")}</p>
        </div>

        <div className="flex flex-col items-center gap-2 group/stat">
          <div className={cn(
            "p-3 rounded-2xl border transition-all duration-300 group-hover/stat:scale-110",
            streak > 0 
              ? "bg-accent/10 text-accent border-accent/20 group-hover/stat:shadow-[0_0_15px_oklch(var(--accent)/0.3)]" 
              : "bg-muted/5 text-muted-foreground/40 border-border/10"
          )}>
            <Flame className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black tracking-tight tabular-nums text-foreground">
            {streak}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t("streak")}</p>
        </div>

        <div className="flex flex-col items-center gap-2 group/stat">
          <div className="p-3 rounded-2xl bg-muted/10 text-muted-foreground border border-border/20 transition-all duration-300 group-hover/stat:scale-110">
            <Target className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black tracking-tight tabular-nums text-foreground">
            {bestStreak}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t("best")}</p>
        </div>
      </div>
    </div>
  )
}
