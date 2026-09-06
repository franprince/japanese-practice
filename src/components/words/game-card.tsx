"use client"
import type { PracticeReviewProps } from "@/hooks/use-mistake-review"
import type { WordQuestion } from "@/lib/japanese/words"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/core"
import type { GameSessionProps } from "@/lib/core/game-session"
import type { WordFilter } from "@/lib/japanese/words"
import { useI18n } from "@/lib/i18n"
import type { GameMode, WordsGameType } from "@/types/game"
import { useWordGame } from "@/hooks/use-word-game"
import { GameFeedbackSection, FeedbackIcon } from "./game-feedback-section"
import { GameCardContainer, QuestionDisplay, AnswerSection, ActionBar } from "@/components/game/primitives"
import { useEffect } from "react"
import { preloadKanaDictionary } from "@/lib/japanese/shared"

interface GameCardProps extends GameSessionProps, PracticeReviewProps<WordQuestion> {
  mode: GameMode
  filter: WordFilter
  gameType: WordsGameType
  submittedCount: number
  answerAccuracy: number
  suppressFocus?: boolean
  onRequestOpenSettings?: () => void
  disableNext?: boolean
  onIncorrectCharsChange?: (chars: Map<string, { count: number; romaji: string }>) => void
}

export function GameCard({
  mode,
  filter,
  gameType,
  sessionId,
  onSessionEvent,
  submittedCount,
  answerAccuracy,
  suppressFocus = false,
  onRequestOpenSettings,
  disableNext = false,
  onIncorrectCharsChange,
  reviewQuestions,
  onQuestionMissed,
}: GameCardProps) {
  const { t, lang } = useI18n()

  useEffect(() => {
    preloadKanaDictionary()
  }, [])

  const {
    currentWord,
    userInput,
    setUserInput,
    feedback,
    noWordsAvailable,
    isLoading,
    displayRomaji,
    errorDetails,
    incorrectChars,
    inputRef,
    options,
    checkAnswer,
    skipWord,
    handleKeyDown,
    loadNewWord,
  } = useWordGame({
    mode,
    filter,
    gameType,
    disableNext,
    suppressFocus,
    lang,
    sessionId,
    onSessionEvent,
    onIncorrectCharsChange,
    reviewQuestions,
    onQuestionMissed,
  })



  
  if (isLoading) {
    return (
      <div className="w-full max-w-none mx-auto">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground animate-pulse">{t("loading")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }



  
  if (noWordsAvailable) {
    return (
      <div className="w-full max-w-none mx-auto">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="py-12 text-center space-y-4">
            <div>
              <p className="text-muted-foreground mb-2">{t("noWordsTitle")}</p>
              <p className="text-sm text-muted-foreground/70">{t("noWordsBody")}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="cursor-pointer"
              onClick={() => onRequestOpenSettings?.()}
            >
              {t("settings")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentWord) return null

  return (
    <div className="w-full max-w-none mx-auto">

      <GameCardContainer
        feedback={feedback}
        className="backdrop-blur-sm"
      >

        <QuestionDisplay
          value={currentWord.kana}
          prompt={t(gameType === "guess" ? "practice.choosePrompt" : "practice.readPrompt")}
          lang="ja"
        />

        <AnswerSection>
          {gameType === "guess" ? (
            <div className="grid grid-cols-1 gap-2 w-full sm:grid-cols-3">
              {options ? (
                options.map((option) => (
                  <Button
                    key={option}
                    data-testid="guess-option"
                    variant={feedback === null ? "outline" : option === currentWord.romaji ? "success" : "secondary"}
                    className={cn("min-h-12 h-auto whitespace-normal break-words p-3 text-lg", feedback !== null && option === currentWord.romaji && "border-success bg-success/15 text-foreground")}
                    onClick={() => feedback === null && checkAnswer(option)}
                    disabled={feedback !== null || disableNext}
                  >
                    {option}
                  </Button>
                ))
              ) : (
                <div className="col-span-full flex justify-center items-center py-6">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <label htmlFor="word-answer" className="mb-2 block text-sm font-medium">{t("practice.romajiLabel")}</label>
              <Input
                id="word-answer"
                aria-invalid={feedback === "incorrect"}
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("placeholder")}
                className={cn(
                  "text-center text-lg h-14 font-mono bg-background/50 border-2",
                  "transition-[box-shadow,background-color] duration-200", // Focused transition only for specific props
                  feedback === "correct" && "border-success",
                  feedback === "incorrect" && "border-destructive",
                  !feedback && "border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
                )}
                readOnly={feedback !== null || disableNext}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-7"><FeedbackIcon feedback={feedback} /></div>
            </div>
          )}

          <GameFeedbackSection
            feedback={feedback}
            displayRomaji={displayRomaji}
            currentWord={currentWord}
            errorDetails={errorDetails}
            gameType={gameType}
            t={t}
          />

          <ActionBar
            showResult={feedback !== null}
            onSubmit={gameType === "guess" ? undefined : checkAnswer}
            onNext={loadNewWord}
            onSkip={skipWord}
            submitDisabled={disableNext || gameType === "guess" || !userInput.trim()}
            skipDisabled={disableNext}
            nextDisabled={disableNext}
            nextLabel={t("nextWord")}
            t={t}
          />
        </AnswerSection>
      </GameCardContainer>

      {submittedCount > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-6 tabular-nums">
          {t("accuracy")}: {answerAccuracy}%
        </p>
      )}

      {incorrectChars.size > 0 && (
        <details className="mt-4 text-sm">
          <summary className="min-h-11 py-3">{t("practice.reviewDetails")}</summary>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
            {t("incorrectChars") || "Characters to practice"}
          </p>
          <div className="flex flex-wrap justify-center gap-1">
            {Array.from(incorrectChars.entries())
              .sort(([, a], [, b]) => b.count - a.count)
              .map(([kana, { count, romaji }]) => (
                <div
                  key={kana}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-sm font-mono bg-destructive/10 text-destructive border border-destructive/20"
                >
                  <span lang="ja" className="text-lg">{kana}</span>
                  <span className="text-xs opacity-60">({romaji}) ×{count}</span>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  )
}
