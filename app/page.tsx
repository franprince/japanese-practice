"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { SiteHeader } from "@/components/layouts/site-header"
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

/** Renders the headline with its last word in red ink, e.g. "A little Japanese, every <day>." */
function Headline({ text }: { text: string }) {
  const match = text.match(/^(.*\s)(\S+?)([.。!！]?)$/u)
  if (!match) return <>{text}</>
  return <>{match[1]}<span className="text-primary">{match[2]}</span>{match[3]}</>
}

export default function HomePage() {
  const { t } = useI18n()
  const { language } = useLanguage()
  const router = useRouter()
  const hydrated = useHydrated()
  const [last] = useStoredPreference("practice-last", "", isLastPractice)
  const [, setWordsSettings] = useStoredPreference(practiceKey("words"), "", (value): value is string => value !== null)
  const startBeginner = () => { setWordsSettings(JSON.stringify(beginnerSettings)); router.push("/words?preset=beginner") }
  const previous = GAMES.find(game => game.href === `/${last}`)
  return <>
    <SiteHeader start={<Link href="/" className="flex items-stretch border border-border bg-card no-underline">
      <span lang="ja" className="flex items-center border-r border-border px-3.5 py-1.5 font-hand text-[22px] font-semibold tracking-[0.06em]">日本語 練習</span>
      <span className="hidden flex-col justify-center px-3 py-1 text-[11px] leading-[1.3] text-muted-foreground sm:flex"><span>Nihongo Renshū</span><span>practice notebook</span></span>
    </Link>} />
    <main className="flex-1 px-4 sm:px-6">
      <div className="mx-auto max-w-[75rem]">
        <section className="flex flex-wrap items-center justify-between gap-12 pb-16 pt-12 sm:pt-20">
          <div className="min-w-0 flex-[1_1_32rem]">
            <p className="mb-[18px] inline-flex items-center gap-2.5 text-sm font-bold text-primary">
              <span lang="ja" className="font-hand text-lg font-normal">今日の練習</span>
              {language !== "ja" && <><span aria-hidden="true">—</span>{t("practice.todayLabel")}</>}
            </p>
            <h1 className="max-w-[11em] text-balance font-hand text-[clamp(2.75rem,6vw,4.5rem)] font-[650] leading-[1.12] tracking-[-0.025em]"><Headline text={t("practice.homeHeadline")} /></h1>
            <p className="mt-7 max-w-[500px] text-[19px] text-muted-foreground">{t("practice.homeTagline")}</p>
          </div>
          <div aria-hidden="true" className="relative mr-7 hidden sm:flex">
            <div className="flex flex-col bg-card">{heroColumn.map(ch => <span key={ch} lang="ja" className="genko-cell -mt-[1.5px] flex size-24 items-center justify-center font-hand text-[64px] font-semibold first:mt-0">{ch}</span>)}</div>
            <div className="-ml-[1.5px] flex flex-col bg-card">{heroColumn.map((ch, i) => <span key={ch} lang="ja" className="genko-cell genko-trace -mt-[1.5px] flex size-24 items-center justify-center font-hand text-[64px] first:mt-0">{i < 2 ? ch : ""}</span>)}</div>
            <span lang="ja" className="hanko absolute -bottom-6 -right-7 size-[88px] text-[26px]">よく<br />できた</span>
          </div>
        </section>

        <section aria-labelledby="kana-h" className="ink-card flex flex-wrap items-center justify-between gap-7 px-5 py-6 sm:px-8 sm:py-7">
          <div className="flex min-w-0 flex-[1_1_30rem] flex-wrap items-center gap-7">
            <div aria-hidden="true" className="flex">{kanaRow.map((ch, i) => <span key={ch} lang="ja" className={`genko-cell -ml-[1.5px] flex size-14 items-center justify-center font-hand text-4xl first:ml-0 ${i === 0 ? "font-semibold" : "genko-trace"}`}>{ch}</span>)}</div>
            <div className="min-w-0 flex-[1_1_15rem]"><h2 id="kana-h" className="font-hand text-[28px] font-semibold leading-[1.3]">{t("practice.beginner")}</h2><p className="mt-1 text-muted-foreground">{t("practice.beginnerBody")}</p></div>
          </div>
          <Button onClick={startBeginner} className="ink-button h-auto min-h-[52px] gap-2.5 whitespace-normal px-6 text-base font-bold" disabled={!hydrated}>{t("practice.startBeginner")}<ArrowRight className="size-[18px]" aria-hidden="true" /></Button>
        </section>

        {previous && <section className="ink-card mt-6 flex flex-wrap items-center justify-between gap-3 p-4 !shadow-none">
          <div><h2 className="font-medium">{t("practice.again")} · {t(previous.titleKey)}</h2><p className="mt-1 text-sm text-muted-foreground">{t("practice.againBody")}</p></div>
          <Button asChild variant="outline" className="ink-button min-h-11"><Link href={`${previous.href}?again=1`}>{t("practice.again")}</Link></Button>
        </section>}

        <section className="pb-20 pt-[88px]" aria-labelledby="choose-heading">
          <div className="mb-8 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-border pb-3.5">
            <h2 id="choose-heading" className="font-hand text-4xl font-semibold leading-[1.2]">{t("practice.choose")}</h2>
            {language !== "ja" && <span lang="ja" aria-hidden="true" className="font-hand text-xl text-primary">練習を選ぶ</span>}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">{GAMES.map((game, i) => <GameSelectorCard key={game.id} index={i + 1} title={t(game.titleKey)} description={t(game.descriptionKey)} href={game.href} icon={game.icon} examplePrompt={examples[game.id]?.[0] ?? ""} exampleAnswer={examples[game.id]?.[1] ?? ""} />)}</div>
        </section>

        <section className="pb-24" aria-labelledby="tools-heading">
          <div className="mb-8 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-border pb-3.5">
            <h2 id="tools-heading" className="font-hand text-4xl font-semibold leading-[1.2]">{t("practice.tools")}</h2>
            {language !== "ja" && <span lang="ja" aria-hidden="true" className="font-hand text-xl text-primary">道具</span>}
          </div>
          <Link href="/reader" className="ink-card group flex flex-wrap items-center gap-7 px-7 py-6 transition-transform hover:-translate-y-0.5">
            <span lang="ja" aria-hidden="true" className="reader-mark flex shrink-0 items-end gap-1 font-hand text-[44px] font-semibold leading-none"><ruby>読<rt>よ</rt></ruby>む</span>
            <span className="flex min-w-0 flex-[1_1_22rem] flex-col gap-1">
              <span className="font-hand text-2xl font-semibold">{t("tools.reader.title")}</span>
              <span className="text-[15px] text-muted-foreground">{t("tools.reader.description")}</span>
            </span>
            <span className="inline-flex items-center gap-2 font-bold text-primary">{t("tools.reader.open")}<ArrowRight className="size-[18px] transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
          </Link>
        </section>
      </div>
    </main>
  </>
}
