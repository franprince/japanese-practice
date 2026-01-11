"use client"

import type React from "react"

import { Calendar, CalendarDays, CalendarRange } from "lucide-react"
import type { DateMode } from "@/lib/japanese-dates"
import { useI18n } from "@/lib/i18n"

interface DateModeSelectorProps {
  mode: DateMode
  onModeChange: (mode: DateMode) => void
}

export function DateModeSelector({ mode, onModeChange }: DateModeSelectorProps) {
  const { t } = useI18n()

  const modes: { value: DateMode; labelKey: string; icon: React.ReactNode }[] = [
    { value: "days", labelKey: "daysOnly", icon: <CalendarDays className="w-4 h-4" /> },
    { value: "months", labelKey: "monthsOnly", icon: <Calendar className="w-4 h-4" /> },
    { value: "full", labelKey: "fullDates", icon: <CalendarRange className="w-4 h-4" /> },
  ]

  return (
    <div className="flex items-center justify-center gap-2">
      {modes.map(({ value, labelKey, icon }) => (
        <button
          key={value}
          onClick={() => onModeChange(value)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
            ${
              mode === value
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }
          `}
        >
          {icon}
          <span className="hidden sm:inline">{t(labelKey as any)}</span>
        </button>
      ))}
    </div>
  )
}
