"use client"
import { Button } from "@/components/ui/button"
import { IncorrectCharsTable } from "./incorrect-chars-table"
import { useI18n } from "@/lib/i18n"
interface SessionSummaryCardProps {
  title: string
  targetLabel: string
  accuracyLabel: string
  targetCount: number
  accuracy: number
  onRestart: () => void
  onSwitchToInfinite: () => void
  restartLabel: string
  switchLabel: string
  missedCount?: number
  onReview?: () => void
  incorrectChars?: Map<string, { count: number; romaji: string }>
  incorrectCharsLabel?: string
  tableCharacterLabel?: string
  tableErrorsLabel?: string
}
export function SessionSummaryCard({
  title,
  targetLabel,
  accuracyLabel,
  targetCount,
  accuracy,
  onRestart,
  onSwitchToInfinite,
  restartLabel,
  switchLabel,
  missedCount = 0,
  onReview,
  incorrectChars,
  incorrectCharsLabel,
  tableCharacterLabel,
  tableErrorsLabel,
}: SessionSummaryCardProps) {
  const { t } = useI18n()
  return <section className="space-y-4 rounded-2xl border bg-card p-5" aria-label={title}>
    <div role="status">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {targetCount} {targetLabel} · <span>{accuracy}% {accuracyLabel}</span>
      </p>
    </div>
    {missedCount > 0 && <p className="text-sm">{t("practice.missedCount").replace("{count}", String(missedCount))}</p>}
    {incorrectChars && incorrectChars.size > 0 && <details className="text-sm"><summary className="min-h-11 py-3">{incorrectCharsLabel || t("practice.reviewDetails")}</summary>
      <IncorrectCharsTable incorrectChars={incorrectChars} tableCharacterLabel={tableCharacterLabel || t("tableCharacter")} tableErrorsLabel={tableErrorsLabel || t("tableErrors")} maxItems={10} />
    </details>}
    <div className="flex flex-wrap gap-3">
      {missedCount > 0 && onReview && <Button className="min-h-11" onClick={onReview}>{t("practice.review")}</Button>}
      <Button className="min-h-11" variant={missedCount ? "outline" : "default"} onClick={onRestart}>{restartLabel}</Button>
      <Button className="min-h-11" variant="ghost" onClick={onSwitchToInfinite}>{switchLabel}</Button>
    </div>
  </section>
}
