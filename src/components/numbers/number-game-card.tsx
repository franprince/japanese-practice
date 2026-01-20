"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { NumberPad } from "@/components/numbers/number-pad"
import { ArrowRight, SkipForward } from "lucide-react"
import {
  numberPadKeysArabic,
  type Difficulty,
} from "@/lib/japanese/numbers"
import { useI18n } from "@/lib/i18n"
import { getResponsiveFontSize } from "@/lib/core"
import { useNumberGame } from "@/hooks/use-number-game"

interface NumberGameCardProps {
  difficulty: Difficulty
  mode: "arabicToKanji" | "kanjiToArabic"
  onScoreUpdate: (score: number, streak: number, correct: boolean) => void
  disableNext?: boolean
}

export function NumberGameCard({ difficulty, mode, onScoreUpdate, disableNext = false }: NumberGameCardProps) {
  const { t } = useI18n()
  const {
    userAnswer,
    showResult,
    isCorrect,
    shuffleNumbers,
    setShuffleNumbers,
    questionText,
    correctAnswerDisplay,
    correctAnswerRomaji,
    handleKeyPress,
    handleDelete,
    handleClear,
    handleSubmit,
    handleNext,
    handleSkip,
  } = useNumberGame({ difficulty, mode, onScoreUpdate, disableNext })

  const promptLabel = mode === "arabicToKanji" ? t("writeInJapanese") : t("writeInArabic")

  return (
    <div className="space-y-4">
      {/* Question display - always at top */}
      <Card
        className={`p-6 md:p-8 border-2 transition-all duration-300 ${showResult
          ? isCorrect
            ? "border-success bg-success/5 shadow-[0_0_30px_rgba(34,197,94,0.15)]"
            : "border-destructive bg-destructive/5 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
          : "border-border bg-card/50 backdrop-blur-sm"
          }`}
      >
        <div className="text-center mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{promptLabel}</p>
          <div lang={mode === "kanjiToArabic" ? "ja" : undefined} className={`font-bold text-foreground py-4 font-mono whitespace-nowrap transition-all ${getResponsiveFontSize(questionText)}`}>
            {questionText}
          </div>
        </div>

        {/* User answer display */}
        <div className="min-h-16 flex items-center justify-center rounded-xl bg-secondary/30 border border-border/50 mb-4">
          {userAnswer ? (
            <span className="text-3xl md:text-4xl font-bold text-foreground">{userAnswer}</span>
          ) : (
            <span className="text-muted-foreground text-lg">{t("useKeypadBelow")}</span>
          )}
        </div>

        {/* Result display */}
        {showResult && (
          <div
            className={`p-4 rounded-xl border ${isCorrect ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"
              }`}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("correctAnswer")}:</span>
                <div className="text-right">
                  <p lang={mode === "arabicToKanji" ? "ja" : undefined} className="text-xl font-bold text-foreground leading-tight">{correctAnswerDisplay}</p>
                  <p className="text-xs text-muted-foreground/80 leading-tight">{correctAnswerRomaji}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("yourAnswer")}:</span>
                <span className={`text-xl font-bold ${isCorrect ? "text-success" : "text-destructive"}`}>
                  {userAnswer || "—"}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Number pad and controls */}
      <div className="space-y-3">
        {showResult ? (
          <div className="flex justify-center">
            <Button
              onClick={handleNext}
              className="w-full max-w-md h-14 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={disableNext}
            >
              {t("nextNumber")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        ) : (
          <>
            <NumberPad
              onKeyPress={handleKeyPress}
              onDelete={handleDelete}
              onClear={handleClear}
              onSubmit={handleSubmit}
              disabled={showResult || disableNext}
              shuffleNumbers={shuffleNumbers}
              onShuffleChange={setShuffleNumbers}
              keys={mode === "arabicToKanji" ? undefined : numberPadKeysArabic}
              disableShuffle={mode === "kanjiToArabic"}
            />
            <div className="flex justify-center">
              <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground hover:text-foreground">
                <SkipForward className="h-4 w-4 mr-1" />
                {t("skip")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
