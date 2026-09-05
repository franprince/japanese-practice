"use client"
import { useI18n } from "@/lib/i18n"
import type { PlayMode } from "@/lib/core/game-session"

export interface SessionProgressProps {
  answeredCount: number
  targetCount: number
  playMode: PlayMode
  sessionComplete: boolean
  reviewing?: boolean
}
export function SessionProgress({ answeredCount, targetCount, playMode, sessionComplete, reviewing }: SessionProgressProps) {
  const { t } = useI18n()
  const label = playMode === "infinite" || sessionComplete
    ? t("practice.completedProgress").replace("{count}", String(answeredCount))
    : t("practice.questionProgress").replace("{current}", String(answeredCount)).replace("{total}", String(targetCount))
  return <div data-testid="session-progress" className="space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span>{label}</span>
      <span className="text-muted-foreground">
        {reviewing ? t("practice.reviewing") : playMode === "infinite" ? t("playModeInfinite") : t("playModeSession")}
      </span>
    </div>
    {playMode === "session" && <progress className="block h-1.5 w-full overflow-hidden rounded-full" max={targetCount} value={Math.min(answeredCount, targetCount)} aria-label={label} />}
  </div>
}
