"use client"
import { Suspense, useState, useEffect, useMemo } from "react"
import { GameCard, WordsSettingsOverlay, MobileWordsetModal } from "@/components/words"
import { StatsDisplay } from "@/components/game/stats-display"
import { type WordQuestion, type WordFilter, type CharacterGroup } from "@/lib/japanese/words"
import { getCharacterGroups, preloadKanaDictionary } from "@/lib/japanese/shared"
import type { GameMode, WordsGameType } from "@/types/game"
import { SessionSummaryCard } from "@/components/game/session-summary-card"
import { GamePageLayout } from "@/components/layouts/game-page-layout"
import { PracticeSettingsTrigger } from "@/components/game/practice-settings-dialog"
import { SessionProgress } from "@/components/game/session-progress"
import { PracticeReady } from "@/components/game/practice-ready"
import { useRouter, useSearchParams } from "next/navigation"
import { beginnerSettings } from "@/lib/practice-preferences"
import { usePracticePreferences } from "@/hooks/use-practice-preferences"
import { useSessionProgress } from "@/hooks/use-session-progress"
import { useI18n } from "@/lib/i18n"
import { useMobileWordset } from "@/hooks/use-mobile-wordset"

const questionKey = (question: WordQuestion) =>
  `${question.word?.type}:${question.word?.kana}:${question.word?.romaji}`
export default function WordsPage() {
  return <Suspense><PracticeReady><WordsPractice /></PracticeReady></Suspense>
}
function WordsPractice() {
  const { t, lang } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [beginner] = useState(() => searchParams.get("preset") === "beginner")
  const [settings, saveSettings] = usePracticePreferences("words", beginner ? beginnerSettings : undefined)
  useEffect(() => {
    if (beginner && searchParams.has("preset")) router.replace("/words", { scroll: false })
  }, [beginner, searchParams, router])
  const session = useSessionProgress<WordQuestion>({
    t,
    basePoints: 1,
    defaultTargetCount: settings.targetCount,
    defaultPlayMode: settings.playMode,
    questionKey,
  })
  const [characterGroups, setCharacterGroups] = useState<CharacterGroup[]>([])
  const [groupsReady, setGroupsReady] = useState(false)
  const [groupError, setGroupError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [incorrectChars, setIncorrectChars] = useState<Map<string, { count: number; romaji: string }>>(new Map())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const filter = useMemo<WordFilter>(
    () => settings.filter ?? { selectedGroups: characterGroups.map(group => group.id), minLength: 3, maxLength: 6 },
    [settings.filter, characterGroups],
  )
  useEffect(() => {
    let active = true
    preloadKanaDictionary()
    getCharacterGroups().then(groups => { if (active) { setCharacterGroups(groups); setGroupsReady(true) } }).catch(() => { if (active) setGroupError(true) })
    return () => { active = false }
  }, [attempt])
  const {
    gameType, isMobile, mobileConfirmOpen, downloadProgress, busy, downloadError,
    persisting, wordsetSizeMB, setGameType, confirmWordMode, cancelConfirm,
  } = useMobileWordset(lang, undefined, settings.gameType)
  const reset = (mode?: "infinite" | "session", count?: number) => { session.resetSession(mode, count); setIncorrectChars(new Map()) }
  const apply = (mode: GameMode, nextType: WordsGameType, playMode: "session" | "infinite", targetCount: number, nextFilter: WordFilter) => {
    const changed = mode !== settings.mode || nextType !== gameType || playMode !== session.playMode || targetCount !== session.settingsTargetCount || JSON.stringify(nextFilter) !== JSON.stringify(filter)
    if (!changed) return
    saveSettings({ version: 1, mode, gameType: nextType, playMode, targetCount, filter: nextFilter })
    if (nextType !== gameType) setGameType(nextType)
    reset(playMode, targetCount)
  }
  const modeLabel = t(settings.mode === "custom" ? "custom" : settings.mode === "hiragana" ? "hiraganaLabel" : settings.mode === "katakana" ? "katakanaLabel" : "bothLabel")
  const typeLabel = t(gameType === "words" ? "modeWords" : gameType === "characters" ? "modeCharacters" : "modeGuess")
  return <GamePageLayout title={t("wordsLabel")} subtitle={t("tip")}
    configuration={`${modeLabel} · ${typeLabel}`} progress={<SessionProgress {...session} />}
    settingsTrigger={<PracticeSettingsTrigger onClick={() => setSettingsOpen(true)} />}
    stats={<StatsDisplay {...session} />}
    footer={isMobile && gameType === "characters" ? <p className="text-sm leading-relaxed text-muted-foreground">{t("practice.mobileWords")}</p> : undefined}
  >
    <WordsSettingsOverlay open={settingsOpen} onOpenChange={setSettingsOpen} mode={settings.mode} gameType={gameType} playMode={session.playMode} targetCount={session.settingsTargetCount} filter={filter} onApply={apply} characterGroups={characterGroups} />
    {session.sessionComplete && <SessionSummaryCard {...session.sessionSummaryProps} onRestart={() => reset()} onSwitchToInfinite={() => { saveSettings({ ...settings, playMode: "infinite" }); reset("infinite") }} incorrectChars={incorrectChars} incorrectCharsLabel={t("incorrectChars")} tableCharacterLabel={t("tableCharacter")} tableErrorsLabel={t("tableErrors")} />}
    {groupError ? <div role="alert" className="space-y-3 rounded-xl border p-5"><p>{t("practice.loadingError")}</p><button className="min-h-11 underline" onClick={() => { setGroupError(false); setAttempt(value => value + 1) }}>{t("practice.retry")}</button></div>
      : !groupsReady ? <p role="status" className="p-8 text-center">{t("loading")}</p>
      : <GameCard sessionId={session.sessionId} mode={settings.mode} filter={filter} onSessionEvent={session.handleSessionEvent} submittedCount={session.submittedCount} answerAccuracy={session.answerAccuracy} onRequestOpenSettings={() => setSettingsOpen(true)} disableNext={session.sessionComplete} suppressFocus={settingsOpen || mobileConfirmOpen} gameType={gameType} onIncorrectCharsChange={setIncorrectChars} reviewQuestions={session.reviewQuestions} onQuestionMissed={session.onQuestionMissed} />}
    <MobileWordsetModal open={mobileConfirmOpen} title={t("words.downloadTitle")} message={`${t("words.downloadMessage")} (~${wordsetSizeMB}MB).`} progress={downloadProgress} busy={busy} error={downloadError ? t(downloadError) : null} statusMessage={t(persisting ? "words.downloadPersisting" : "words.downloading")} onCancel={() => { cancelConfirm(); saveSettings({ ...settings, gameType: "characters" }) }} onConfirm={confirmWordMode} confirmLabel={t(downloadError ? "words.downloadRetry" : "common.download")} cancelLabel={t("common.cancel")} confirmDisabled={busy} />
  </GamePageLayout>
}
