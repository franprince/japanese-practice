"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getRandomWord, type JapaneseWord, type WordFilter } from "@/lib/japanese-words"
import { useI18n } from "@/lib/i18n"
import { Check, X, Flame, SkipForward, Zap } from "lucide-react"

import type { GameMode } from "@/types/game"

interface GameCardProps {
  mode: GameMode
  filter: WordFilter // Added filter prop
  onScoreUpdate: (score: number, streak: number, correct: boolean) => void
  suppressFocus?: boolean
  onRequestCloseSettings?: () => void
}

export function GameCard({
  mode,
  filter,
  onScoreUpdate,
  suppressFocus = false,
  onRequestCloseSettings,
}: GameCardProps) {
  const [currentWord, setCurrentWord] = useState<JapaneseWord | null>(null)
  const [userInput, setUserInput] = useState("")
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [noWordsAvailable, setNoWordsAvailable] = useState(false) // Handle empty results
  const [isLoading, setIsLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useI18n()

  const loadNewWord = useCallback(async () => {
    setIsLoading(true)
    const word = await getRandomWord(mode, filter) // Pass filter
    if (word) {
      setCurrentWord(word)
      setNoWordsAvailable(false)
    } else {
      setCurrentWord(null)
      setNoWordsAvailable(true)
    }
    setIsLoading(false)
    setUserInput("")
    setFeedback(null)
    setTimeout(() => {
      if (!suppressFocus) inputRef.current?.focus()
    }, 100)
  }, [mode, filter, suppressFocus])

  useEffect(() => {
    loadNewWord()
  }, [loadNewWord])

  useEffect(() => {
    if (!suppressFocus) {
      // when settings close, restore focus
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [suppressFocus])

  const checkAnswer = () => {
    if (!currentWord || !userInput.trim()) return

    const isCorrect = userInput.toLowerCase().trim() === currentWord.romaji.toLowerCase()
    setFeedback(isCorrect ? "correct" : "incorrect")
    setTotalAttempts((prev) => prev + 1)

    if (isCorrect) {
      const newScore = score + (1 + Math.floor(streak / 5))
      const newStreak = streak + 1
      setScore(newScore)
      setStreak(newStreak)
      onScoreUpdate(newScore, newStreak, true)
    } else {
      setStreak(0)
      onScoreUpdate(score, 0, false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (feedback) {
        loadNewWord()
      } else {
        checkAnswer()
      }
    }
  }

  const skipWord = () => {
    setStreak(0)
    onScoreUpdate(score, 0, false)
    loadNewWord()
  }

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
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">{t("noWordsTitle")}</p>
            <p className="text-sm text-muted-foreground/70">{t("noWordsBody")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentWord) return null

  const getFontSize = (length: number) => {
    if (length <= 2) return "text-7xl md:text-8xl"
    if (length <= 4) return "text-6xl md:text-7xl"
    if (length <= 6) return "text-5xl md:text-6xl"
    if (length <= 8) return "text-4xl md:text-5xl"
    return "text-3xl md:text-4xl"
  }

  return (
    <div className="w-full max-w-xl mx-auto">
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
          {currentWord.type === "hiragana" ? "ひらがな" : "カタカナ"}
        </Badge>
      </div>

      <Card
        className={cn(
          "transition-all duration-300 border-2 backdrop-blur-sm",
          feedback === "correct" && "border-success bg-success/10 shadow-[0_0_30px_-5px_var(--success)]",
          feedback === "incorrect" && "border-destructive bg-destructive/10 shadow-[0_0_30px_-5px_var(--destructive)]",
          !feedback && "border-border/50 bg-card/80",
        )}
      >
        <CardContent className="pt-10 pb-8 px-6 md:px-8">
          {/* Japanese Character Display */}
          <div className="text-center mb-10">
            <div
              className={cn("font-medium mb-4 tracking-widest transition-all", getFontSize(currentWord.kana.length))}
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
                onFocus={() => onRequestCloseSettings?.()}
                placeholder={t("placeholder")}
                className={cn(
                  "text-center text-lg h-14 font-mono bg-background/50 border-2 transition-all",
                  feedback === "correct" && "border-success",
                  feedback === "incorrect" && "border-destructive",
                  !feedback && "border-border/50 focus:border-primary",
                )}
                readOnly={feedback !== null}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              {feedback && (
                <div
                  className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2",
                    feedback === "correct" ? "text-success" : "text-destructive",
                  )}
                >
                  {feedback === "correct" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </div>
              )}
            </div>

            {feedback && (
              <div className="text-center p-4 bg-secondary/50 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200 border border-border/50 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t("correctAnswer")}</p>
                  <p className="text-xl font-mono font-semibold text-primary">{currentWord.romaji}</p>
                </div>
                {currentWord.meaning && (
                  <div className="pt-2 border-t border-border/30">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t("meaning")}</p>
                    <p className="text-base text-foreground/90">{currentWord.meaning}</p>
                  </div>
                )}
                {currentWord.kanji && (
                  <div className="pt-2 border-t border-border/30">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t("kanji")}</p>
                    <p className="text-lg font-medium text-foreground">{currentWord.kanji}</p>
                    <a
                      href={`https://jisho.org/search/${encodeURIComponent(currentWord.kanji)}%20%23kanji`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs text-primary hover:underline"
                    >
                      {t("showMeaning")}
                    </a>
                  </div>
                )}
              </div>
            )}

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
                <Button onClick={loadNewWord} className="w-full bg-primary hover:bg-primary/90 cursor-pointer">
                  {t("nextWord")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accuracy */}
      {totalAttempts > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-6 tabular-nums">
          {t("accuracy")}: {Math.round((score / totalAttempts) * 100)}%
        </p>
      )}
    </div>
  )
}
