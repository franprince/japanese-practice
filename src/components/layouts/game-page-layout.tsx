"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useI18n } from "@/lib/i18n"
import type { GamePageLayoutProps } from "@/types/ui"

export function GamePageLayout({ title, subtitle, children, controls, topbarContent, stats, footer, settingsTrigger, progress, configuration }: GamePageLayoutProps) {
  const { t } = useI18n()
  return <main className="flex-1 px-4 pb-10 pt-4 sm:pt-6">
    <div className="mx-auto w-full max-w-2xl">
      <nav aria-label={t("home")} className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" className="min-h-11"><Link href="/">← {t("home")}</Link></Button>
        <div className="flex items-center gap-1"><ThemeSwitcher /><LanguageSwitcher /></div>
      </nav>
      <header className="mb-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>{settingsTrigger}</div>
        <p className="text-sm leading-relaxed text-muted-foreground">{configuration || subtitle}</p>
        {(controls || topbarContent) && <div className="flex flex-wrap gap-3">{topbarContent || controls}</div>}
        {progress}
      </header>
      <div className="space-y-5">{children}</div>
      {stats && <div className="mt-5">{stats}</div>}
      {footer && <div className="mt-6 border-t pt-4">{footer}</div>}
    </div>
  </main>
}
