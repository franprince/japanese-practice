"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/core"
import { useI18n } from "@/lib/i18n"

export function Footer() {
  const { t } = useI18n()
  const pathname = usePathname()
  
  // Game routes where the footer should be hidden on mobile
  const gameRoutes = ['/words', '/kanji', '/dates', '/numbers']
  const isGameRoute = gameRoutes.some(route => pathname?.startsWith(route))

  return (
    <footer className={cn(
      "border-t border-border/40 bg-card/60 backdrop-blur py-8",
      isGameRoute && "hidden md:block" // Hide on mobile, show on md and above for game routes
    )}>
      <div className="mx-auto max-w-5xl px-4 text-xs text-muted-foreground leading-relaxed space-y-1.5">
        <p className="text-sm font-medium text-foreground">
          {t("footer.developedBy")} Fran 🇦🇷 • <a href="mailto:hey@franprince.dev" className="hover:underline hover:text-primary transition-colors">hey@franprince.dev</a>
        </p>
        <p className="text-sm text-muted-foreground">{t("footer.inspiredBy")} kana.pro</p>
        <p>
          {t("footer.license")}
        </p>
      </div>
    </footer>
  )
}
