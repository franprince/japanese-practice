"use client"
import { NumberGameCard } from "@/components/numbers/number-game-card"
import { DifficultySelector } from "@/components/numbers/difficulty-selector"
import { difficultyRanges } from "@/lib/japanese/numbers"
import { GamePageLayout } from "@/components/layouts/game-page-layout"
import { PracticeSettings } from "@/components/game/practice-settings"
import { SessionSummaryCard } from "@/components/game/session-summary-card"
import { SessionProgress } from "@/components/game/session-progress"
import { StatsDisplay } from "@/components/game/stats-display"
import { PracticeReady } from "@/components/game/practice-ready"
import { usePracticePreferences } from "@/hooks/use-practice-preferences"
import { useSessionProgress } from "@/hooks/use-session-progress"
import { useI18n } from "@/lib/i18n"

export default function Page() {
  return <PracticeReady><Practice /></PracticeReady>
}
function Practice() {
  const { t } = useI18n()
  const [settings, saveSettings] = usePracticePreferences("numbers")
  const session = useSessionProgress<number>({ t, defaultTargetCount: settings.targetCount, defaultPlayMode: settings.playMode })
  return <GamePageLayout
    title={t("numbersTitle")}
    subtitle={t("numbersSubtitle")}
    configuration={`${t(settings.difficulty)} (${difficultyRanges[settings.difficulty].label}) · ${t(settings.mode === "arabicToKanji" ? "numbersModeArabicToKanji" : "numbersModeKanjiToArabic")}`}
    progress={<SessionProgress {...session} />}
    settingsTrigger={<PracticeSettings
      settings={settings}
      onApply={next => { saveSettings(next); session.resetSession(next.playMode, next.targetCount) }}
    >
      {(draft, update) => <div className="space-y-3">
        <h2 className="font-semibold">{t("practice.subject")}</h2>
        <DifficultySelector difficulty={draft.difficulty} onDifficultyChange={difficulty => update({ difficulty })} />
        <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("modeLabel")}>
          {(["arabicToKanji", "kanjiToArabic"] as const).map(mode => <button
            key={mode}
            aria-pressed={draft.mode === mode}
            onClick={() => update({ mode })}
            className={`min-h-11 rounded-xl border p-3 text-sm ${draft.mode === mode ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >{t(mode === "arabicToKanji" ? "numbersModeArabicToKanji" : "numbersModeKanjiToArabic")}</button>)}
        </div>
      </div>}
    </PracticeSettings>}
    stats={<StatsDisplay {...session} />}
  >
    {session.sessionComplete && <SessionSummaryCard {...session.sessionSummaryProps} onRestart={() => session.resetSession()} onSwitchToInfinite={() => { saveSettings({ ...settings, playMode: "infinite" }); session.resetSession("infinite") }} />}
    <NumberGameCard sessionId={session.sessionId} onSessionEvent={session.handleSessionEvent} reviewQuestions={session.reviewQuestions} onQuestionMissed={session.onQuestionMissed} difficulty={settings.difficulty} mode={settings.mode} disableNext={session.sessionComplete} />
  </GamePageLayout>
}
