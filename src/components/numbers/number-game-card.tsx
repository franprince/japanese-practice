"use client"

import { Card } from "@/components/ui/card"
import { NumberPad } from "@/components/numbers/number-pad"
import {
  numberPadKeysArabic,
  type Difficulty,
} from "@/lib/japanese/numbers"
import { useI18n } from "@/lib/i18n"
import { useNumberGame } from "@/hooks/use-number-game"
import { GameCardContainer, QuestionDisplay, AnswerSection, ResultDisplay, ActionBar } from "@/components/game/primitives"

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
      <GameCardContainer feedback={showResult ? (isCorrect ? "correct" : "incorrect") : null}>
        <QuestionDisplay
          value={questionText}
          prompt={promptLabel}
          lang={mode === "kanjiToArabic" ? "ja" : undefined}
        />

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
          <ResultDisplay
            isCorrect={isCorrect}
            expectedAnswer={correctAnswerDisplay}
            userAnswer={userAnswer}
            romaji={correctAnswerRomaji}
            t={t}
          />
        )}
      </GameCardContainer>

      {/* Number pad and controls */}
      <AnswerSection>
        {showResult ? (
          <ActionBar
            showResult={showResult}
            onNext={handleNext}
            nextDisabled={disableNext}
            nextLabel={t("nextNumber")}
            t={t}
          />
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
            <ActionBar
              showResult={false}
              onSkip={handleSkip}
              t={t}
            />
          </>
        )}
      </AnswerSection>
    </div>
  )
}
