"use client"
import { cn } from "@/lib/core"
import { useI18n } from "@/lib/i18n"
import type { PlayMode, SessionOutcome } from "@/lib/core/game-session"

export interface SessionProgressProps {
  answeredCount: number
  targetCount: number
  playMode: PlayMode
  sessionComplete: boolean
  reviewing?: boolean
  outcomes?: SessionOutcome[]
}

type Mark = { outcome?: SessionOutcome; current: boolean }

/** One square per question, marked like a teacher's red pen: ○ correct, ✕ wrong, – skipped. */
function ProgressMarks({ marks, small, label }: { marks: Mark[]; small: boolean; label: string }) {
  return <div role="img" aria-label={label} className="session-marks flex-wrap gap-1">
    {marks.map((mark, index) => <span key={index} className={cn("flex items-center justify-center border-[1.5px] bg-card", small ? "size-5" : "size-7", mark.current ? "border-primary" : "border-foreground/25")}>
      {mark.outcome === "correct" && <svg viewBox="0 0 24 24" className="size-[78%] text-primary" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /></svg>}
      {mark.outcome === "incorrect" && <svg viewBox="0 0 24 24" className="size-[70%]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>}
      {mark.outcome === "skipped" && <span aria-hidden="true" className="text-xs text-muted-foreground">–</span>}
    </span>)}
  </div>
}

export function SessionProgress({ answeredCount, targetCount, playMode, sessionComplete, reviewing, outcomes = [] }: SessionProgressProps) {
  const { t } = useI18n()
  const label = playMode === "infinite" || sessionComplete
    ? t("practice.completedProgress").replace("{count}", String(answeredCount))
    : t("practice.questionProgress").replace("{current}", String(answeredCount)).replace("{total}", String(targetCount))
  const marks: Mark[] = playMode === "session"
    ? Array.from({ length: Math.min(targetCount, 50) }, (_, index) => ({ outcome: outcomes[index], current: !sessionComplete && index === answeredCount }))
    : [...outcomes.slice(-9).map(outcome => ({ outcome, current: false })), { current: true }]
  return <div data-testid="session-progress" className="session-progress space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">
        {reviewing ? t("practice.reviewing") : playMode === "infinite" ? t("playModeInfinite") : t("playModeSession")}
      </span>
    </div>
    <ProgressMarks marks={marks} small={playMode === "session" && targetCount > 20} label={label} />
    {playMode === "session" && <progress className="session-progress-bar block h-1.5 w-full overflow-hidden rounded-full" max={targetCount} value={Math.min(answeredCount, targetCount)} aria-label={label} />}
  </div>
}
