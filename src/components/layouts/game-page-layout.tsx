"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/layouts/site-header"
import { useI18n, useLanguage } from "@/lib/i18n"
import type { GamePageLayoutProps } from "@/types/ui"

export function GamePageLayout({ title, kicker, subtitle, children, controls, topbarContent, stats, footer, settingsTrigger, progress, configuration }: GamePageLayoutProps) {
  const { t } = useI18n()
  const { language } = useLanguage()
  return <>
  <SiteHeader label={t("home")} start={<Button asChild variant="ghost" className="min-h-11 gap-2 px-2 font-bold"><Link href="/"><ArrowLeft className="size-[18px]" aria-hidden="true" />{t("home")}</Link></Button>} />
  <main className="flex-1 px-4 pb-16 pt-8 sm:pt-10">
    <div className="mx-auto w-full max-w-[60rem]">
      <header className="mb-5 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            {kicker && language !== "ja" && <p lang="ja" className="font-hand text-lg text-primary">{kicker}</p>}
            <h1 className="font-hand text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-[40px]">{title}</h1>
            <p className={configuration ? "config-tag mt-2 text-sm leading-relaxed text-muted-foreground" : "mt-2 text-sm leading-relaxed text-muted-foreground"}>{configuration || subtitle}</p>
          </div>
          {settingsTrigger}
        </div>
        {(controls || topbarContent) && <div className="flex flex-wrap gap-3">{topbarContent || controls}</div>}
        {(progress || stats) && <div className="notebook-panel flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          {progress && <div className="min-w-0 flex-[1_1_20rem]">{progress}</div>}
          {stats && <div className="shrink-0">{stats}</div>}
        </div>}
      </header>
      <div className="space-y-5">{children}</div>
      {footer && <div className="mt-6 border-t pt-4">{footer}</div>}
    </div>
  </main>
  </>
}
