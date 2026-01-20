"use client"

import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { GameSelectorCard } from "@/components/game-selector-card"
import { useI18n } from "@/lib/i18n"
import { GAMES } from "@/lib/core"

export default function HomePage() {
  const { t } = useI18n()

  const games = GAMES.map(game => ({
    title: t(game.titleKey as any) || game.id,
    description: t(game.descriptionKey as any) || "",
    href: game.href,
    icon: game.icon,
    gradient: game.gradient,
  }))


  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle wave-like shapes in background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-primary/[0.02] blur-3xl" />
        <div className="absolute top-1/3 -left-1/4 w-2/3 h-1/2 rounded-full bg-accent/[0.02] blur-3xl" />
        <div className="absolute -bottom-1/4 right-1/4 w-1/2 h-1/2 rounded-full bg-primary/[0.015] blur-3xl" />
      </div>
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16 relative">
        <header className="mb-12 md:mb-20">
          <div className="flex flex-col-reverse md:flex-row md:items-start md:justify-between mb-6 gap-4 md:gap-6">
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light text-foreground mb-2 sm:mb-3 tracking-tight">
                <span lang="ja">日本語 練習</span>
              </h1>
              <div className="h-1 w-16 sm:w-20 bg-primary" />
            </div>
            <div className="flex-shrink-0 flex flex-wrap items-center gap-2 justify-between">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground md:max-w-md leading-relaxed font-light">
            {t("heroTagline")}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-20">
          {games.map((game, index) => (
            <GameSelectorCard
              key={game.href}
              title={game.title}
              description={game.description}
              href={game.href}
              icon={game.icon}
              gradient={game.gradient}
              index={index}
            />
          ))}
        </div>

        <section className="pt-12 pb-8 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            <div>
              <div lang="ja" className="text-4xl mb-4 text-foreground">学</div>
              <h3 className="font-light text-foreground/80 mb-2 text-lg">{t("pillar.learning.title")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("pillar.learning.body")}</p>
            </div>
            <div>
              <div lang="ja" className="text-4xl mb-4 text-foreground">心</div>
              <h3 className="font-light text-foreground/80 mb-2 text-lg">{t("pillar.mindfulness.title")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("pillar.mindfulness.body")}</p>
            </div>
            <div>
              <div lang="ja" className="text-4xl mb-4 text-foreground">道</div>
              <h3 className="font-light text-foreground/80 mb-2 text-lg">{t("pillar.path.title")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("pillar.path.body")}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
