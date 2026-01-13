"use client"

import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { GameSelectorCard } from "@/components/game-selector-card"
import { useI18n } from "@/lib/i18n"
import { GAMES } from "@/lib/game-registry"

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
      <div className="absolute inset-0 pointer-events-none">
        {/* Mountain-like shapes in background */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 w-2/3 h-1/3 bg-gradient-to-t from-accent/3 via-transparent to-transparent" />

        {/* Subtle circular elements (inspired by Japanese moon) */}
        <div className="absolute top-20 right-10 w-32 h-32 rounded-full border border-primary/10 blur-sm" />
        <div className="absolute bottom-40 left-20 w-24 h-24 rounded-full border border-accent/10 blur-sm" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16 relative">
        <header className="mb-12 md:mb-20">
          <div className="flex flex-col-reverse md:flex-row md:items-start md:justify-between mb-6 gap-4 md:gap-6">
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light text-white mb-2 sm:mb-3 tracking-tight">
                日本語 練習
              </h1>
              <div className="h-1 w-16 sm:w-20 bg-primary" />
            </div>
            <div className="flex-shrink-0 flex flex-wrap items-center gap-2 justify-between">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-white/70 md:max-w-md leading-relaxed font-light">
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

        <footer className="mt-20 pt-12 pb-8 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            <div>
              <div className="text-4xl mb-4">学</div>
              <h3 className="font-light text-white/80 mb-2 text-lg">{t("pillar.learning.title")}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{t("pillar.learning.body")}</p>
            </div>
            <div>
              <div className="text-4xl mb-4">心</div>
              <h3 className="font-light text-white/80 mb-2 text-lg">{t("pillar.mindfulness.title")}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{t("pillar.mindfulness.body")}</p>
            </div>
            <div>
              <div className="text-4xl mb-4">道</div>
              <h3 className="font-light text-white/80 mb-2 text-lg">{t("pillar.path.title")}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{t("pillar.path.body")}</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
