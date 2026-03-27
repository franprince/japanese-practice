"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/core"
import type { WordFilter } from "@/lib/japanese/words"
import { useI18n } from "@/lib/i18n"
import { Flame, Zap, Type, Shuffle, Trophy } from "lucide-react"
import type { GameMode, WordsGameType } from "@/types/game"
import { useWordGame } from "@/hooks/use-word-game"
import { GameFeedbackSection, FeedbackIcon } from "./game-feedback-section"
import { GameCardContainer, QuestionDisplay, AnswerSection, ActionBar } from "@/components/game/primitives"

interface GameCardProps {
  mode: GameMode
  filter: WordFilter
  gameType: WordsGameType
  onScoreUpdate: (score: number, streak: number, correct: boolean) => void
  suppressFocus?: boolean
  onRequestCloseSettings?: () => void
  onRequestOpenSettings?: () => void
  disableNext?: boolean
  onIncorrectCharsChange?: (chars: Map<string, { count: number; romaji: string }>) => void
}

export function GameCard({
  mode,
  filter,
  gameType,
  onScoreUpdate,
  suppressFocus = false,
  onRequestCloseSettings,
  onRequestOpenSettings,
  disableNext = false,
  onIncorrectCharsChange,
}: GameCardProps) {
  const { t, lang } = useI18n()

  const {
    currentWord,
    userInput,
    setUserInput,
    feedback,
    score,
    streak,
    totalAttempts,
    noWordsAvailable,
    isLoading,
    displayRomaji,
    errorDetails,
    incorrectChars,
    inputRef,
    options,
    accuracyPercent,
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
    onScoreUpdate,
    onIncorrectCharsChange,
  })



  
  if (isLoading) {
    return (
      <div className="w-full max-w-xl mx-auto">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground animate-pulse">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }



  
  if (noWordsAvailable) {
    return (
      <div className="w-full max-w-xl mx-auto">
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
    <div className="w-full max-w-xl mx-auto">
      {}
      <div className="flex items-center justify-between mb-8 px-2 md:hidden animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">{t("score")}</span>
            <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-black tabular-nums text-primary">{score}</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">{t("streak")}</span>
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all duration-300",
              streak > 0 ? "bg-accent/10 border-accent/20 text-accent" : "bg-muted/5 border-border/10 text-muted-foreground/40"
            )}>
              <Flame className="w-3.5 h-3.5" />
              <span className="text-sm font-black tabular-nums">{streak}</span>
            </div>
          </div>
        </div>
        <div className="flex items-end flex-col gap-2">
           <Badge variant="secondary" className="rounded-full bg-background/40 backdrop-blur-md border-border/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            <span lang="ja" className="mr-1">{currentWord.type === "hiragana" ? "あ" : "ア"}</span>
            {currentWord.type === "hiragana" ? "Hiragana" : "Katakana"}
          </Badge>
        </div>
      </div>

      {}
      <GameCardContainer
        feedback={feedback}
        className="backdrop-blur-sm"
      >
        {}

        {}
        <QuestionDisplay
          value={currentWord.kana}
          lang="ja"
        />

        {}
        <AnswerSection>
          {gameType === "guess" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 min-h-[4rem] w-full max-w-sm mx-auto p-4">
              {options ? (
                options.map((option) => (
                  <Button
                    key={option}
                    variant={feedback === null ? "outline" : option === currentWord.romaji ? "success" : "secondary"}
                    className={cn(
                      "h-20 text-2xl font-black tracking-tight glass-card transition-all duration-300 active:scale-95",
                      feedback === null && "hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_20px_oklch(var(--primary)/0.2)]",
                      feedback === "correct" && option === currentWord.romaji && "bg-success/20 border-success shadow-[0_0_20px_rgba(var(--success),0.2)] scale-105",
                      feedback === "incorrect" && option === currentWord.romaji && "bg-success/10 border-success/50 opacity-80",
                      feedback !== null && option !== currentWord.romaji && "opacity-40 scale-95 grayscale"
                    )}
                    onClick={() => feedback === null && checkAnswer(option)}
                    disabled={feedback !== null}
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
              <Input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("placeholder")}
                className={cn(
                  "text-center text-lg h-14 font-mono bg-background/50 border-2 transition-all",
                  feedback === "correct" && "border-success",
                  feedback === "incorrect" && "border-destructive",
                  !feedback && "border-border/50 focus:border-primary"
                )}
                readOnly={feedback !== null}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <FeedbackIcon feedback={feedback} />
            </div>
          )}

          {}
          <GameFeedbackSection
            feedback={feedback}
            displayRomaji={displayRomaji}
            currentWord={currentWord}
            errorDetails={errorDetails}
            t={t}
          />

          {}
          <ActionBar
            showResult={feedback !== null}
            onSubmit={checkAnswer}
            onNext={loadNewWord}
            onSkip={skipWord}
            submitDisabled={gameType === "guess" || !userInput.trim()}
            nextDisabled={disableNext}
            nextLabel={t("nextWord")}
            t={t}
          />
        </AnswerSection>
      </GameCardContainer>

      {}
      {totalAttempts > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-6 tabular-nums">
          {t("accuracy")}: {accuracyPercent}%
        </p>
      )}

      {}
      {incorrectChars.size > 0 && (
        <div className="mt-4 text-center">
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
        </div>
      )}
    </div>
  )
}
