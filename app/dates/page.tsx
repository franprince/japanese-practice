"use client"
import { DateGameCard } from "@/components/dates/date-game-card"
import { DateModeSelector } from "@/components/dates/date-mode-selector"
import type { DateQuestion } from "@/lib/japanese/dates"
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
  const [settings, saveSettings] = usePracticePreferences("dates")
  const session = useSessionProgress<DateQuestion>({ t, defaultTargetCount: settings.targetCount, defaultPlayMode: settings.playMode })
  return <GamePageLayout
    title={t("datesTitle")}
    subtitle={t("datesSubtitle")}
    configuration={t(settings.mode === "week_days" ? "weekDays" : settings.mode === "months" ? "monthsOnly" : "fullDates")}
    progress={<SessionProgress {...session} />}
    settingsTrigger={<PracticeSettings
      settings={settings}
      onApply={next => { saveSettings(next); session.resetSession(next.playMode, next.targetCount) }}
    >
      {(draft, update) => <div className="space-y-3">
        <h2 className="font-semibold">{t("practice.subject")}</h2>
        <DateModeSelector mode={draft.mode} onModeChange={mode => update({ mode })} />
      </div>}
    </PracticeSettings>}
    stats={<StatsDisplay {...session} />}
  >
    {session.sessionComplete && <SessionSummaryCard {...session.sessionSummaryProps} onRestart={() => session.resetSession()} onSwitchToInfinite={() => { saveSettings({ ...settings, playMode: "infinite" }); session.resetSession("infinite") }} />}
    <DateGameCard sessionId={session.sessionId} onSessionEvent={session.handleSessionEvent} reviewQuestions={session.reviewQuestions} onQuestionMissed={session.onQuestionMissed} mode={settings.mode} disableNext={session.sessionComplete} />
  </GamePageLayout>
}
