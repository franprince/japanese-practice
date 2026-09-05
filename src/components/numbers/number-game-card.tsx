"use client"

import type { GameSessionProps } from "@/lib/core/game-session"

import { Button } from "@/components/ui/button"
import { NumberPad } from "@/components/numbers/number-pad"
import { ArrowRight, SkipForward } from "lucide-react"
import {
  numberPadKeysArabic,
  type Difficulty,
} from "@/lib/japanese/numbers"
import { useI18n } from "@/lib/i18n"
import { useNumberGame } from "@/hooks/use-number-game"
import { GameCardContainer, QuestionDisplay, ResultDisplay } from "@/components/game/primitives"

interface NumberGameCardProps extends GameSessionProps {
  difficulty: Difficulty
  mode: "arabicToKanji" | "kanjiToArabic"
  disableNext?: boolean
}

export function NumberGameCard({ difficulty, mode, sessionId, onSessionEvent, disableNext = false }: NumberGameCardProps) {
  const { t } = useI18n()
  const {
    isReady,
    userAnswer,
    showResult,
    isCorrect,
    shuffleNumbers,
    questionText,
    correctAnswerDisplay,
    correctAnswerRomaji,
    handleKeyPress,
    handleDelete,
    handleClear,
    handleSubmit,
    handleNext,
    handleSkip,
  } = useNumberGame({ difficulty, mode, sessionId, onSessionEvent, disableNext })

  if (!isReady) return null

  const promptLabel = mode === "arabicToKanji" ? t("writeInJapanese") : t("writeInArabic")

  
  const feedback = showResult ? (isCorrect ? "correct" : "incorrect") : null

  return (
    <div className="space-y-4">
      {}
      <GameCardContainer feedback={feedback} className="backdrop-blur-sm">
        {}
        <QuestionDisplay
          value={questionText}
          prompt={promptLabel}
          lang={mode === "kanjiToArabic" ? "ja" : undefined}
        />

        {}
        <div className="min-h-16 flex items-center justify-center rounded-xl bg-secondary/30 border border-border/50 mb-4">
          {userAnswer ? (
            <span
              lang={mode === "arabicToKanji" ? "ja" : undefined}
              className="text-3xl md:text-4xl font-bold text-foreground"
            >
              {userAnswer}
            </span>
          ) : (
            <span className="text-muted-foreground text-lg">{t("useKeypadBelow")}</span>
          )}
        </div>

        {}
        {showResult && (
          <ResultDisplay
            isCorrect={isCorrect}
            expectedAnswer={correctAnswerDisplay}
            userAnswer={userAnswer || "—"}
            romaji={correctAnswerRomaji}
            t={t}
          />
        )}
      </GameCardContainer>

      {}
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
              keys={mode === "arabicToKanji" ? undefined : numberPadKeysArabic}
              disableShuffle={mode === "kanjiToArabic"}
            />
            <div className="flex justify-center">
              <Button variant="ghost" onClick={handleSkip} disabled={disableNext} className="text-muted-foreground hover:text-foreground">
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
