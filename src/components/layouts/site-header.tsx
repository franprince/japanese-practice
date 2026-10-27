"use client"
import type { ReactNode } from "react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { cn } from "@/lib/core"

/** Full-width top bar shared by the home page and every practice page. */
export function SiteHeader({ start, label, className }: { start: ReactNode; label?: string; className?: string }) {
  return <header className={cn("site-header border-b border-border bg-card px-4 sm:px-6", className)}>
    <nav aria-label={label} className="mx-auto flex max-w-[75rem] flex-wrap items-center justify-between gap-3 py-3 sm:py-4">
      {start}
      <div className="flex flex-wrap items-center gap-2.5"><ThemeSwitcher /><LanguageSwitcher /></div>
    </nav>
  </header>
}
