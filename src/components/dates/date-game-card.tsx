"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Check, X, ArrowRight, SkipForward, Calendar, CalendarDays, Hash, Type } from "lucide-react"
import { generateDateQuestion, type DateMode, type DateQuestion } from "@/lib/japanese-dates"
import { useI18n } from "@/lib/i18n"

interface DateGameCardProps {
  mode: DateMode
  onScoreUpdate: (score: number, streak: number, correct: boolean) => void
  disableNext?: boolean
}

export function DateGameCard({ mode, onScoreUpdate, disableNext = false }: DateGameCardProps) {
  const [question, setQuestion] = useState<DateQuestion | null>(null)
  const [userInput, setUserInput] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showNumbers, setShowNumbers] = useState(false)
  const enterOnResultRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useI18n()

  const generateNewQuestion = useCallback(() => {
    if (disableNext) return
    enterOnResultRef.current = false
    setQuestion(generateDateQuestion(mode, t, showNumbers))
    setUserInput("")
    setShowResult(false)
    setIsCorrect(false)
  }, [mode, disableNext, showNumbers, t])

  useEffect(() => {
    generateNewQuestion()
  }, [generateNewQuestion, showNumbers])

  useEffect(() => {
    if (!showResult && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showResult, question])

  const handleSubmit = () => {
    if (!question) return

    const userAnswer = userInput.trim().toLowerCase()
    const normalizedAnswer = question.answer.toLowerCase()
    const normalizedRomaji = question.romaji.toLowerCase().replace(/\s+/g, "")


    const correct = userAnswer === normalizedAnswer || userAnswer === normalizedRomaji

    setIsCorrect(correct)
    setShowResult(true)

    if (correct) {
      const newStreak = streak + 1
      const bonus = Math.floor(newStreak / 5) * 5
      const newScore = score + 10 + bonus
      setScore(newScore)
      setStreak(newStreak)
      onScoreUpdate(newScore, newStreak, true)
    } else {
      setStreak(0)
      onScoreUpdate(score, 0, false)
    }
  }

  const handleSkip = () => {
    setStreak(0)
    onScoreUpdate(score, 0, false)
    generateNewQuestion()
  }

  const handleDelete = () => {
    setUserInput(userInput.slice(0, -1))
  }

  const handleClear = () => {
    setUserInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (showResult && !disableNext) {
        e.preventDefault()
        enterOnResultRef.current = true
      } else if (!showResult) {
        handleSubmit()
      }
    } else if (e.key === "Backspace" && !showResult) {
      e.preventDefault()
      handleDelete()
    } else if (e.key === "Escape" && !showResult) {
      handleClear()
    }
  }

  if (!question) return null

  const getModeIcon = () => {
    switch (mode) {
      case "week_days":
        return <CalendarDays className="w-5 h-5 text-primary" />
      case "full":
        return <Calendar className="w-5 h-5 text-primary" />
    }
  }

  const getModeLabel = () => {
    switch (mode) {
      case "week_days":
        return t("weekDays")
      case "months":
        return t("month")
      case "full":
        return t("date")
    }
  }

  const handleInputChange = (value: string) => {
    if (showResult) return
    setUserInput(value)
  }

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && showResult && !disableNext) {
      if (!enterOnResultRef.current) return
      e.preventDefault()
      enterOnResultRef.current = false
      generateNewQuestion()
    }
  }

  return (
    <div
      className={`
        relative rounded-2xl border-2 bg-card p-6 md:p-8 transition-all duration-300
        ${showResult ? (isCorrect ? "border-green-500/50 shadow-lg shadow-green-500/10" : "border-red-500/50 shadow-lg shadow-red-500/10") : "border-border"}
      `}
    >

      <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground text-sm">
        {getModeIcon()}
        <span>{getModeLabel()}</span>
      </div>


      {(mode === "months" || mode === "week_days") && (
        <div className="absolute top-4 right-4 md:top-6 md:right-6">
          <button
            onClick={() => setShowNumbers(!showNumbers)}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title={showNumbers ? t("showName") || "Show Name" : t("showNumber") || "Show Number"}
          >
            {showNumbers ? <Type className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
          </button>
        </div>
      )}


      <div className="text-center mb-6">
        <div className="text-6xl md:text-7xl font-bold text-foreground mb-2 font-mono">
          {mode === "months" && showNumbers ? question.displayNumber : question.display}
        </div>
        {mode === "full" && <p className="text-sm text-muted-foreground">{t("writeFullDate")}</p>}
        {mode === "months" && <p className="text-sm text-muted-foreground">{t("writeMonthReading")}</p>}
        {mode === "week_days" && <p className="text-sm text-muted-foreground">{t("writeWeekDay")}</p>}
      </div>


      <div className="mb-4">
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          readOnly={showResult}
          aria-disabled={showResult}
          placeholder={t("typeHiraganaOrRomaji")}
          className={`
            w-full px-4 py-3 text-lg text-center rounded-xl border-2 bg-background
            placeholder:text-muted-foreground/50 focus:outline-none transition-all
            ${showResult ? "border-border opacity-60" : "border-border focus:border-primary"}
          `}
        />
      </div>


      {showResult && (
        <div
          className={`
            mb-4 p-4 rounded-xl border
            ${isCorrect ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}
          `}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            {isCorrect ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
            <span className={`font-medium ${isCorrect ? "text-green-500" : "text-red-500"}`}>
              {isCorrect ? t("correct") : t("incorrect")}
            </span>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">{t("correctAnswer")}:</p>
            <p className="text-xl font-medium">{question.answer}</p>
            <p className="text-sm text-muted-foreground">({question.romaji})</p>
            {question.kanji && <p className="text-lg text-primary mt-2">{question.kanji}</p>}
          </div>
        </div>
      )}


      <div className="flex gap-3">
        {showResult ? (
          <button
            onClick={() => {
              if (!disableNext) generateNewQuestion()
            }}
            disabled={disableNext}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {t("nextDate")}
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button
              onClick={handleSkip}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              <span className="hidden sm:inline">{t("skip")}</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("check")}
              <Check className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
