"use client"
import type { ReactNode } from "react"
import { cn } from "@/lib/core"
export function GameCardContainer({ feedback, children, className }: { feedback: "correct" | "incorrect" | null; children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border bg-card p-4 sm:p-6", feedback === "correct" && "border-success", feedback === "incorrect" && "border-destructive", className)}>{children}</div>
}
