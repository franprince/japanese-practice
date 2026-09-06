"use client"

import * as React from "react"
import { CheckCircle2, Infinity as LucideInfinity } from "lucide-react"
import { cn } from "@/lib/core"
import { useI18n } from "@/lib/i18n"

interface SessionSectionProps {
  playMode: "infinite" | "session"
  targetCount: number
  onPlayModeChange: (playMode: "infinite" | "session") => void
  onTargetCountChange: (targetCount: number) => void
}

export function SessionSection({ playMode, targetCount, onPlayModeChange, onTargetCountChange }: SessionSectionProps) {
  const { t } = useI18n()
  const sessionCounts = [5, 10, 20, 50]
  return <section className="space-y-4">
    <div className="flex items-center gap-2">
      <h3 className="text-sm font-medium">{t("practice.length")}</h3>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div role="group" aria-label={t("modeLabel")} className="p-1 bg-secondary rounded-xl border border-border flex gap-2">
        <button onClick={() => onPlayModeChange("infinite")} aria-pressed={playMode === "infinite"} className={cn("min-h-11 flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-colors", playMode === "infinite" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")}>
          <LucideInfinity className="w-4 h-4" /><span className="text-sm font-medium">{t("playModeInfinite")}</span>
        </button>
        <button onClick={() => onPlayModeChange("session")} aria-pressed={playMode === "session"} className={cn("min-h-11 flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-colors", playMode === "session" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")}>
          <CheckCircle2 className="w-4 h-4" /><span className="text-sm font-medium">{t("playModeSession")}</span>
        </button>
      </div>
      <div role="group" aria-label={t("practice.length")} className={cn("p-1 bg-secondary rounded-xl border border-border flex gap-2 transition-opacity", playMode !== "session" && "opacity-30 grayscale")}>
        {sessionCounts.map(count => <button key={count} onClick={() => onTargetCountChange(count)} disabled={playMode !== "session"} aria-pressed={targetCount === count} className={cn("min-h-11 flex-1 py-2 rounded-xl text-sm font-medium transition-colors", targetCount === count ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")}>{count}</button>)}
      </div>
    </div>
  </section>
}
