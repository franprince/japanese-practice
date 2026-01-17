"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { WordFilter } from "@/lib/japanese-words"
import { useI18n } from "@/lib/i18n"
import { Flame, SkipForward, Zap, Type, Shuffle } from "lucide-react"
import type { GameMode } from "@/types/game"
import { useWordGame } from "@/hooks/use-word-game"
import { GameFeedbackSection, FeedbackIcon } from "./game-feedback-section"
import { getResponsiveFontSize } from "@/lib/utils/font-sizing"

interface GameCardProps {
  mode: GameMode
  filter: WordFilter
  onScoreUpdate: (score: number, streak: number, correct: boolean) => void
  suppressFocus?: boolean
  onRequestCloseSettings?: () => void
  onRequestOpenSettings?: () => void
  disableNext?: boolean
  isCharacterMode?: boolean
  onToggleCharacterMode?: () => void
  /** Callback when incorrect characters change (for session summary) */
  onIncorrectCharsChange?: (chars: Map<string, { count: number; romaji: string }>) => void
}

export function GameCard({
  mode,
  filter,
  onScoreUpdate,
  suppressFocus = false,
  onRequestCloseSettings,
  onRequestOpenSettings,
  disableNext = false,
  isCharacterMode = false,
  onToggleCharacterMode,
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
    accuracyPercent,
    checkAnswer,
    skipWord,
    handleKeyDown,
    loadNewWord,
  } = useWordGame({
    mode,
    filter,
    isCharacterMode,
    disableNext,
    suppressFocus,
    lang,
    onScoreUpdate,
    onIncorrectCharsChange,
  })



  // Loading state
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

  // No words available state
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
      {/* Score and Streak Display */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold tabular-nums">{score}</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className={cn("w-4 h-4 transition-colors", streak > 0 ? "text-accent" : "text-muted-foreground")} />
            <span className="text-sm font-semibold tabular-nums">{streak}</span>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs font-medium tracking-wide">
          <span lang="ja">{currentWord.type === "hiragana" ? "ひらがな" : "カタカナ"}</span>
        </Badge>
      </div>

      {/* Main Game Card */}
      <Card
        className={cn(
          "transition-all duration-300 border-2 backdrop-blur-sm relative",
          feedback === "correct" && "border-success bg-success/10 shadow-[0_0_30px_-5px_var(--success)]",
          feedback === "incorrect" && "border-destructive bg-destructive/10 shadow-[0_0_30px_-5px_var(--destructive)]",
          !feedback && "border-border/50 bg-card/80"
        )}
      >
        <CardContent className="pt-10 pb-8 px-6 md:px-8">
          {/* Character Mode Toggle */}
          {onToggleCharacterMode && (
            <div className="absolute top-4 right-4 md:top-6 md:right-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCharacterMode}
                className="h-8 w-8 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                title={isCharacterMode ? t("switchToWords") : t("switchToCharacters")}
              >
                {isCharacterMode ? <Type className="w-5 h-5" /> : <Shuffle className="w-5 h-5" />}
              </Button>
            </div>
          )}

          {/* Mode Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6 text-muted-foreground text-sm font-medium">
            {isCharacterMode ? <Shuffle className="w-4 h-4" /> : <Type className="w-4 h-4" />}
            <span>{isCharacterMode ? t("modeCharacters") : t("modeWords")}</span>
          </div>

          {/* Japanese Character Display */}
          <div className="text-center mb-10">
            <div
              id="word-question"
              lang="ja"
              className={cn("font-medium mb-4 tracking-widest transition-all whitespace-nowrap", getResponsiveFontSize(currentWord.kana))}
            >
              {currentWord.kana}
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-5">
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

            {/* Feedback Section */}
            <GameFeedbackSection
              feedback={feedback}
              displayRomaji={displayRomaji}
              currentWord={currentWord}
              errorDetails={errorDetails}
              t={t}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {!feedback ? (
                <>
                  <Button
                    variant="outline"
                    onClick={skipWord}
                    className="flex-1 bg-transparent border-border/50 hover:bg-secondary/50 hover:border-border cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    {t("skip")}
                  </Button>
                  <Button
                    onClick={checkAnswer}
                    className="flex-1 bg-primary hover:bg-primary/90 cursor-pointer"
                    disabled={!userInput.trim()}
                  >
                    {t("check")}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    if (!disableNext) loadNewWord()
                  }}
                  className="w-full bg-primary hover:bg-primary/90 cursor-pointer"
                  disabled={disableNext}
                >
                  {t("nextWord")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accuracy Display */}
      {totalAttempts > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-6 tabular-nums">
          {t("accuracy")}: {accuracyPercent}%
        </p>
      )}

      {/* Session Incorrect Characters Summary */}
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
