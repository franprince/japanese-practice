"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { GameSelectorCard } from "@/components/game-selector-card"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { useStoredPreference } from "@/hooks/use-stored-preference"
import { useHydrated } from "@/hooks/use-hydrated"
import { beginnerSettings, practiceKey } from "@/lib/practice-preferences"
import { GAMES } from "@/lib/core"
const examples: Record<string, string> = { romaji: "ねこ → neko", numbers: "24 → 二十四", kanji: "水 → みず", dates: "月曜日 → getsuyoubi" }
const isLastPractice = (value: string | null): value is string => value !== null && ["", "words", "numbers", "kanji", "dates"].includes(value)
export default function HomePage() {
  const { t } = useI18n()
  const router = useRouter()
  const hydrated = useHydrated()
  const [last] = useStoredPreference("practice-last", "", isLastPractice)
  const [, setWordsSettings] = useStoredPreference(practiceKey("words"), "", (value): value is string => value !== null)
  const startBeginner = () => { setWordsSettings(JSON.stringify(beginnerSettings)); router.push("/words?preset=beginner") }
  const previous = GAMES.find(game => game.href === `/${last}`)
  return <main className="flex-1 px-4 py-5 sm:px-6 sm:py-8">
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4"><h1 lang="ja" className="text-3xl font-medium tracking-tight sm:text-4xl">日本語 練習</h1><div className="flex items-center gap-1"><ThemeSwitcher /><LanguageSwitcher /></div></div>
        <h2 className="text-2xl font-semibold sm:text-3xl">{t("practice.choose")}</h2><p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">{t("practice.homeSubtitle")}</p>
      </header>
      <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/40 bg-primary/5 p-5">
        <div className="max-w-lg"><h2 className="text-lg font-semibold">{t("practice.beginner")}</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("practice.beginnerBody")}</p></div>
        <Button onClick={startBeginner} className="h-auto min-h-11 whitespace-normal" disabled={!hydrated}>{t("practice.startBeginner")}</Button>
      </section>
      {previous && <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div><h2 className="font-medium">{t("practice.again")} · {t(previous.titleKey)}</h2><p className="mt-1 text-sm text-muted-foreground">{t("practice.againBody")}</p></div>
        <Button asChild variant="outline" className="min-h-11"><Link href={`${previous.href}?again=1`}>{t("practice.again")}</Link></Button>
      </section>}
      <div className="grid gap-4 sm:grid-cols-2">{GAMES.map(game => <GameSelectorCard key={game.id} title={t(game.titleKey)} description={t(game.descriptionKey)} href={game.href} icon={game.icon} example={examples[game.id] || ""} />)}</div>
    </div>
  </main>
}
