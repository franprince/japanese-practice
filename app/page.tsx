"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { GameSelectorCard } from "@/components/game-selector-card"
import { Button } from "@/components/ui/button"
import { useI18n, useLanguage } from "@/lib/i18n"
import { useStoredPreference } from "@/hooks/use-stored-preference"
import { useHydrated } from "@/hooks/use-hydrated"
import { beginnerSettings, practiceKey } from "@/lib/practice-preferences"
import { GAMES } from "@/lib/core"
const examples: Record<string, [string, string]> = { romaji: ["ねこ", "neko"], numbers: ["24", "二十四"], kanji: ["水", "みず"], dates: ["月曜日", "getsuyoubi"] }
const heroColumn = ["毎", "日", "練", "習"]
const kanaRow = ["あ", "い", "う", "え", "お"]
const isLastPractice = (value: string | null): value is string => value !== null && ["", "words", "numbers", "kanji", "dates"].includes(value)
export default function HomePage() {
  const { t } = useI18n()
  const { language } = useLanguage()
  const router = useRouter()
  const hydrated = useHydrated()
  const [last] = useStoredPreference("practice-last", "", isLastPractice)
  const [, setWordsSettings] = useStoredPreference(practiceKey("words"), "", (value): value is string => value !== null)
  const startBeginner = () => { setWordsSettings(JSON.stringify(beginnerSettings)); router.push("/words?preset=beginner") }
  const previous = GAMES.find(game => game.href === `/${last}`)
  return <main className="flex-1 px-4 py-5 sm:px-6 sm:py-8">
    <div className="mx-auto max-w-5xl">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="ink-card flex items-stretch !rounded-md !shadow-none">
          <span lang="ja" className="flex items-center border-r-2 border-foreground px-3 py-1.5 font-hand text-xl font-semibold tracking-wider sm:text-2xl">日本語 練習</span>
          <span className="hidden flex-col justify-center px-3 text-[11px] leading-tight text-muted-foreground sm:flex"><span>Nihongo Renshū</span><span>practice notebook</span></span>
        </Link>
        <div className="flex items-center gap-1"><ThemeSwitcher /><LanguageSwitcher /></div>
      </header>

      <section className="mb-12 flex flex-wrap items-center justify-between gap-10">
        <div className="min-w-0 flex-[1_1_28rem]">
          <p className="mb-4 flex items-center gap-2 text-sm font-bold text-primary">
            <span lang="ja" className="font-hand text-lg">今日の練習</span>
            {language !== "ja" && <><span aria-hidden="true">—</span>{t("practice.todayLabel")}</>}
          </p>
          <h1 className="font-hand text-4xl font-semibold leading-[1.15] sm:text-6xl">{t("practice.homeHeadline")}</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">{t("practice.homeTagline")}</p>
        </div>
        <div aria-hidden="true" className="relative mr-6 hidden sm:flex">
          <div className="flex flex-col bg-card">{heroColumn.map(ch => <span key={ch} lang="ja" className="genko-cell -mt-0.5 flex size-20 items-center justify-center font-hand text-5xl font-semibold first:mt-0">{ch}</span>)}</div>
          <div className="-ml-0.5 flex flex-col bg-card">{heroColumn.map((ch, i) => <span key={ch} lang="ja" className="genko-cell genko-trace -mt-0.5 flex size-20 items-center justify-center font-hand text-5xl first:mt-0">{i < 2 ? ch : ""}</span>)}</div>
          <span lang="ja" className="hanko absolute -bottom-6 -right-7 size-20 text-xl">よく<br />できた</span>
        </div>
      </section>

      <section className="ink-card mb-6 flex flex-wrap items-center justify-between gap-6 p-5 sm:p-7">
        <div className="flex min-w-0 flex-[1_1_28rem] flex-wrap items-center gap-6">
          <div aria-hidden="true" className="flex">{kanaRow.map((ch, i) => <span key={ch} lang="ja" className={`genko-cell -ml-0.5 flex size-12 items-center justify-center font-hand text-3xl first:ml-0 ${i === 0 ? "font-semibold" : "genko-trace"}`}>{ch}</span>)}</div>
          <div className="min-w-0 flex-[1_1_14rem]"><h2 className="font-hand text-2xl font-semibold">{t("practice.beginner")}</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("practice.beginnerBody")}</p></div>
        </div>
        <Button onClick={startBeginner} className="ink-button h-auto min-h-12 whitespace-normal px-5 text-base font-bold" disabled={!hydrated}>{t("practice.startBeginner")}</Button>
      </section>

      {previous && <section className="ink-card mb-6 flex flex-wrap items-center justify-between gap-3 p-4 !shadow-none">
        <div><h2 className="font-medium">{t("practice.again")} · {t(previous.titleKey)}</h2><p className="mt-1 text-sm text-muted-foreground">{t("practice.againBody")}</p></div>
        <Button asChild variant="outline" className="ink-button min-h-11"><Link href={`${previous.href}?again=1`}>{t("practice.again")}</Link></Button>
      </section>}

      <section className="mt-14" aria-labelledby="choose-heading">
        <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-foreground pb-3">
          <h2 id="choose-heading" className="font-hand text-3xl font-semibold">{t("practice.choose")}</h2>
          {language !== "ja" && <span lang="ja" aria-hidden="true" className="font-hand text-lg text-primary">練習を選ぶ</span>}
        </div>
        <div className="grid gap-6 sm:grid-cols-2">{GAMES.map((game, i) => <GameSelectorCard key={game.id} index={i + 1} title={t(game.titleKey)} description={t(game.descriptionKey)} href={game.href} icon={game.icon} examplePrompt={examples[game.id]?.[0] ?? ""} exampleAnswer={examples[game.id]?.[1] ?? ""} />)}</div>
      </section>
    </div>
  </main>
}
