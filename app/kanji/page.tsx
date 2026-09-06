"use client"
import { KanjiGameCard } from "@/components/kanji/kanji-game-card"
import { KanjiDifficultySelector } from "@/components/kanji/kanji-difficulty-selector"
import type { KanjiEntry } from "@/lib/japanese/kanji"
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
  const [settings, saveSettings] = usePracticePreferences("kanji")
  const session = useSessionProgress<KanjiEntry>({ t, defaultTargetCount: settings.targetCount, defaultPlayMode: settings.playMode })
  return <GamePageLayout
    title={t("kanjiTitle")}
    subtitle={t("kanjiSubtitle")}
    configuration={`${t(settings.difficulty)} · ${settings.difficulty === "easy" ? "N5" : settings.difficulty === "medium" ? "N5–N3" : "N5–N1"}`}
    progress={<SessionProgress {...session} />}
    settingsTrigger={<PracticeSettings
      settings={settings}
      onApply={next => { saveSettings(next); session.resetSession(next.playMode, next.targetCount) }}
    >
      {(draft, update) => <div className="space-y-3">
        <h2 className="font-semibold">{t("practice.subject")}</h2>
        <KanjiDifficultySelector difficulty={draft.difficulty} onDifficultyChange={difficulty => update({ difficulty })} />
      </div>}
    </PracticeSettings>}
    stats={<StatsDisplay {...session} />}
  >
    {session.sessionComplete && <SessionSummaryCard {...session.sessionSummaryProps} onRestart={() => session.resetSession()} onSwitchToInfinite={() => { saveSettings({ ...settings, playMode: "infinite" }); session.resetSession("infinite") }} />}
    <KanjiGameCard sessionId={session.sessionId} onSessionEvent={session.handleSessionEvent} reviewQuestions={session.reviewQuestions} onQuestionMissed={session.onQuestionMissed} difficulty={settings.difficulty} disableNext={session.sessionComplete} />
  </GamePageLayout>
}
