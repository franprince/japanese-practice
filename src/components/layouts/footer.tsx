"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/core"
import { useI18n } from "@/lib/i18n"

function ArgentinaFlag() {
  return <svg width="20" height="14" viewBox="0 0 20 14" role="img" aria-label="Argentina" className="shrink-0">
    <rect width="20" height="14" rx="2" fill="#74ACDF" /><rect y="4.67" width="20" height="4.67" fill="#FFFFFF" /><circle cx="10" cy="7" r="1.6" fill="#F6B40E" />
  </svg>
}

export function Footer() {
  const { t } = useI18n()
  const pathname = usePathname()

  // Game routes where the footer should be hidden on mobile
  const gameRoutes = ['/words', '/kanji', '/dates', '/numbers']
  const isGameRoute = gameRoutes.some(route => pathname?.startsWith(route))

  return (
    <footer className={cn("border-t border-border bg-card px-4 sm:px-6", isGameRoute && "hidden md:block")}>
      <div className="mx-auto flex max-w-[75rem] flex-wrap justify-between gap-6 py-9 text-sm text-muted-foreground">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 font-bold text-foreground">{t("footer.developedBy")} Fran <ArgentinaFlag /></span>
          <a href="mailto:hey@franprince.dev" className="text-foreground underline-offset-4 hover:text-primary hover:underline">hey@franprince.dev</a>
        </div>
        <div className="flex max-w-[560px] flex-col gap-1">
          <span>{t("footer.inspiredBy")} <a href="https://kana.pro" className="text-foreground underline-offset-4 hover:text-primary hover:underline">kana.pro</a></span>
          <span>{t("footer.license")}</span>
        </div>
      </div>
    </footer>
  )
}
