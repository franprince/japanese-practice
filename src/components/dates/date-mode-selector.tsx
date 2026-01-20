"use client"

import type React from "react"

import { Calendar, CalendarDays, CalendarRange } from "lucide-react"
import type { DateMode } from "@/lib/japanese/dates"
import { useI18n } from "@/lib/i18n"

interface DateModeSelectorProps {
  mode: DateMode
  onModeChange: (mode: DateMode) => void
}

export function DateModeSelector({ mode, onModeChange }: DateModeSelectorProps) {
  const { t } = useI18n()

  const modes: { value: DateMode; labelKey: string; icon: React.ReactNode }[] = [
    { value: "week_days", labelKey: "weekDays", icon: <CalendarDays className="w-4 h-4" /> },
    { value: "months", labelKey: "monthsOnly", icon: <Calendar className="w-4 h-4" /> },
    { value: "full", labelKey: "fullDates", icon: <CalendarRange className="w-4 h-4" /> },
  ]

  return (
    <div className="inline-flex items-center gap-0.5 p-1 rounded-full bg-card/70 border border-border/60">
      {modes.map(({ value, labelKey, icon }) => (
        <button
          key={value}
          onClick={() => onModeChange(value)}
          className={`flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${mode === value
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          {icon}
          <span>{t(labelKey as any)}</span>
        </button>
      ))}
    </div>
  )
}
