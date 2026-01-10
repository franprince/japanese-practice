import { Flame, Trophy, Target } from "lucide-react"

interface StatsDisplayProps {
  score: number
  streak: number
  bestStreak: number
}

export function StatsDisplay({ score, streak, bestStreak }: StatsDisplayProps) {
  return (
    <div className="flex items-center justify-center gap-8 md:gap-12 w-full max-w-lg mx-auto py-4">
      <div className="flex flex-col items-center gap-1">
        <Trophy className="w-5 h-5 text-primary" />
        <p className="text-2xl font-bold tabular-nums">{score}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</p>
      </div>
      <div className="h-8 w-px bg-border/50" />
      <div className="flex flex-col items-center gap-1">
        <Flame className="w-5 h-5 text-accent" />
        <p className="text-2xl font-bold tabular-nums">{streak}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Streak</p>
      </div>
      <div className="h-8 w-px bg-border/50" />
      <div className="flex flex-col items-center gap-1">
        <Target className="w-5 h-5 text-muted-foreground" />
        <p className="text-2xl font-bold tabular-nums">{bestStreak}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Best</p>
      </div>
    </div>
  )
}
