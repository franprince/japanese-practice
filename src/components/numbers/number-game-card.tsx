"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { NumberPad } from "@/components/numbers/number-pad"
import { ArrowRight, SkipForward } from "lucide-react"
import {
  generateRandomNumber,
  arabicToJapanese,
  japaneseToArabic,
  difficultyRanges,
  japaneseNumbers,
  type Difficulty,
} from "@/lib/japanese-numbers"
import { useI18n } from "@/lib/i18n"

interface NumberGameCardProps {
  difficulty: Difficulty
  onScoreUpdate: (score: number, streak: number, correct: boolean) => void
}

export function NumberGameCard({ difficulty, onScoreUpdate }: NumberGameCardProps) {
  const { t } = useI18n()
  const [currentNumber, setCurrentNumber] = useState<number>(1)
  const [userAnswer, setUserAnswer] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [shuffleNumbers, setShuffleNumbers] = useState(false)

  const generateNewNumber = useCallback(() => {
    const range = difficultyRanges[difficulty]
    const newNumber = generateRandomNumber(range.min, range.max)
    setCurrentNumber(newNumber)
    setUserAnswer("")
    setShowResult(false)
  }, [difficulty])

  useEffect(() => {
    generateNewNumber()
  }, [generateNewNumber])

  const handleKeyPress = (key: string) => {
    if (showResult) return
    setUserAnswer((prev) => prev + key)
  }

  const handleDelete = () => {
    if (showResult) return
    setUserAnswer((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    if (showResult) return
    setUserAnswer("")
  }

  const handleSubmit = () => {
    if (showResult || !userAnswer) return

    const userValue = japaneseToArabic(userAnswer)
    const correct = userValue === currentNumber

    setIsCorrect(correct)
    setShowResult(true)

    const newStreak = correct ? streak + 1 : 0
    const streakBonus = correct && newStreak > 0 && newStreak % 5 === 0 ? 5 : 0
    const newScore = correct ? score + 1 + streakBonus : score

    setScore(newScore)
    setStreak(newStreak)
    onScoreUpdate(newScore, newStreak, correct)
  }

  const handleNext = () => {
    generateNewNumber()
  }

  const handleSkip = () => {
    setStreak(0)
    onScoreUpdate(score, 0, false)
    generateNewNumber()
  }

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (showResult) {
          handleNext()
        } else if (userAnswer) {
          handleSubmit()
        }
      } else if (e.key === "Backspace" && !showResult) {
        handleDelete()
      } else if (e.key === "Escape" && !showResult) {
        handleClear()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showResult, userAnswer])

  const correctAnswer = arabicToJapanese(currentNumber)

  const correctAnswerRomaji = useMemo(() => {
    const toRomaji = (jp: string) =>
      jp
        .split("")
        .map((char) => japaneseNumbers[char as keyof typeof japaneseNumbers]?.reading ?? char)
        .join(" ")
    return toRomaji(correctAnswer)
  }, [correctAnswer])

  return (
    <div className="space-y-4">
      {/* Question display - always at top */}
      <Card
        className={`p-6 md:p-8 border-2 transition-all duration-300 ${
          showResult
            ? isCorrect
              ? "border-success bg-success/5 shadow-[0_0_30px_rgba(34,197,94,0.15)]"
              : "border-destructive bg-destructive/5 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
            : "border-border bg-card/50 backdrop-blur-sm"
        }`}
      >
        <div className="text-center mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t("writeInJapanese")}</p>
          <div className="text-6xl md:text-8xl font-bold text-foreground py-4 font-mono">
            {currentNumber.toLocaleString()}
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
            className={`p-4 rounded-xl border ${
              isCorrect ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"
            }`}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("correctAnswer")}:</span>
                <div className="text-right">
                  <p className="text-xl font-bold text-foreground leading-tight">{correctAnswer}</p>
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
              disabled={showResult}
              shuffleNumbers={shuffleNumbers}
              onShuffleChange={setShuffleNumbers}
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
