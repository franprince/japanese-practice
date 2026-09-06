"use client"
import type { ReactNode } from "react"
import { cn } from "@/lib/core"
interface QuestionDisplayProps { value: string; prompt?: string; icon?: ReactNode; lang?: "ja" | "en" | "es"; className?: string }
export function QuestionDisplay({ value, prompt, lang, className }: QuestionDisplayProps) {
  return <div className={cn("mb-5 space-y-3 text-center", className)}>
    {prompt && <p className="text-sm text-muted-foreground">{prompt}</p>}
    <div lang={lang} data-testid="question-display" className={cn("break-words py-2 font-medium leading-relaxed [overflow-wrap:anywhere]", value.length > 8 ? "text-3xl sm:text-4xl" : value.length > 4 ? "text-4xl sm:text-5xl" : "text-6xl sm:text-7xl")}>{value}</div>
  </div>
}
