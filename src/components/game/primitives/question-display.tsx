"use client"
import type { ReactNode } from "react"
import { cn } from "@/lib/core"
interface QuestionDisplayProps { value: string; prompt?: string; icon?: ReactNode; lang?: "ja" | "en" | "es"; className?: string }
/** Short Japanese prompts are written one character per practice square (genkō yōshi); everything else stays plain text. */
export function QuestionDisplay({ value, prompt, lang, className }: QuestionDisplayProps) {
  const chars = Array.from(value)
  const squares = lang === "ja" && chars.length > 0 && chars.length <= 6 && !/\s/.test(value)
  return <div className={cn("mb-5 space-y-3 text-center", className)}>
    {prompt && <p className="text-sm text-muted-foreground notebook-kicker">{prompt}</p>}
    {squares
      ? <div lang={lang} data-testid="question-display" className="question-cells flex justify-center py-2 font-hand font-semibold">
        {chars.map((char, index) => <span key={index} className={cn("genko-cell flex items-center justify-center", index > 0 && "-ml-0.5", chars.length > 4 ? "size-16 text-4xl sm:size-20 sm:text-5xl" : "size-20 text-5xl sm:size-28 sm:text-7xl")}>{char}</span>)}
      </div>
      : <div lang={lang} data-testid="question-display" className={cn("break-words py-2 font-hand font-medium leading-relaxed [overflow-wrap:anywhere]", value.length > 8 ? "text-3xl sm:text-4xl" : value.length > 4 ? "text-4xl sm:text-5xl" : "text-6xl sm:text-7xl")}>{value}</div>}
  </div>
}
