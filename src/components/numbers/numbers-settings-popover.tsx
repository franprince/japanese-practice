"use client"

import { useState } from "react"
import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import type { PlayMode } from "@/hooks/use-session-progress"

interface NumbersSettingsPopoverProps {
  playMode: PlayMode
  onSelectMode: (mode: PlayMode) => void
  targetCount: number
  onSelectCount: (count: number) => void
  remainingQuestions: number
}

export function NumbersSettingsPopover({
  playMode,
  onSelectMode,
  targetCount,
  onSelectCount,
  remainingQuestions,
}: NumbersSettingsPopoverProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t("settings")}
      >
        <Settings2 className="h-4 w-4" />
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Popover */}
          <div className="absolute left-0 top-full mt-2 z-50 w-64 rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm p-4 shadow-lg space-y-4">
            {/* Play mode */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t("modeLabel")}</p>
              <div className="inline-flex rounded-full border border-border/60 bg-secondary/30 p-1 w-full">
                <button
                  className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    playMode === "infinite" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => onSelectMode("infinite")}
                >
                  {t("playModeInfinite")}
                </button>
                <button
                  className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    playMode === "session" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => onSelectMode("session")}
                >
                  {t("playModeSession")}
                </button>
              </div>
            </div>

            {/* Question count (session only) */}
            {playMode === "session" && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t("questionsLabel")}</p>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map((count) => (
                    <button
                      key={count}
                      className={`flex-1 rounded-lg py-1.5 text-sm font-medium border transition-colors ${
                        targetCount === count
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                      onClick={() => onSelectCount(count)}
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  {t("questionsLeft").replace("{count}", String(remainingQuestions))}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
