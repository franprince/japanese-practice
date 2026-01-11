import { Button } from "@/components/ui/button"
import type { PlayMode } from "@/hooks/use-session-progress"

interface PlayModeControlsProps {
  playMode: PlayMode
  onSelectMode: (mode: PlayMode) => void
  isSession: boolean
  targetCount?: number
  onSelectCount?: (count: number) => void
  remainingQuestions?: number
  infiniteLabel: string
  sessionLabel: string
  questionsLabel?: string
  questionsLeftLabel?: string
}

export function PlayModeControls({
  playMode,
  onSelectMode,
  isSession,
  targetCount,
  onSelectCount,
  remainingQuestions,
  infiniteLabel,
  sessionLabel,
  questionsLabel,
  questionsLeftLabel,
}: PlayModeControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="inline-flex rounded-full border border-border/60 bg-card/70 p-1">
        <Button
          variant={playMode === "infinite" ? "default" : "ghost"}
          size="sm"
          className="rounded-full"
          onClick={() => onSelectMode("infinite")}
        >
          {infiniteLabel}
        </Button>
        <Button
          variant={playMode === "session" ? "default" : "ghost"}
          size="sm"
          className="rounded-full"
          onClick={() => onSelectMode("session")}
        >
          {sessionLabel}
        </Button>
      </div>

      {isSession && onSelectCount && typeof targetCount === "number" && questionsLabel && questionsLeftLabel && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{questionsLabel}:</span>
          <div className="inline-flex rounded-full border border-border/60 bg-card/70 p-1">
            {[5, 10, 15, 20].map((count) => (
              <Button
                key={count}
                variant={targetCount === count ? "default" : "ghost"}
                size="sm"
                className="rounded-full"
                onClick={() => onSelectCount(count)}
              >
                {count}
              </Button>
            ))}
          </div>
          {typeof remainingQuestions === "number" && (
            <span className="text-xs text-muted-foreground/80">
              {questionsLeftLabel.replace("{count}", String(remainingQuestions))}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
