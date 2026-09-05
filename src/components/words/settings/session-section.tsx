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
      <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">03</span>
      <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t("settings.sessionGoals") || "Session Goals"}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-1 bg-white/5 rounded-3xl border border-white/5 flex gap-2">
        <button onClick={() => onPlayModeChange("infinite")} className={cn("flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl transition-all", playMode === "infinite" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5")}>
          <LucideInfinity className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">{t("playModeInfinite")}</span>
        </button>
        <button onClick={() => onPlayModeChange("session")} className={cn("flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl transition-all", playMode === "session" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5")}>
          <CheckCircle2 className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">{t("playModeSession")}</span>
        </button>
      </div>
      <div className={cn("p-1 bg-white/5 rounded-3xl border border-white/5 flex gap-2 transition-all", playMode !== "session" && "opacity-30 pointer-events-none grayscale")}>
        {sessionCounts.map(count => <button key={count} onClick={() => onTargetCountChange(count)} className={cn("flex-1 py-4 rounded-2xl text-[10px] font-black transition-all", targetCount === count ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5")}>{count}</button>)}
      </div>
    </div>
  </section>
}
