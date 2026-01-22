"use client"

import type React from "react"
import { Calendar, CalendarDays, Hash, Type } from "lucide-react"
import type { DateMode } from "@/lib/japanese/dates"
import { useI18n } from "@/lib/i18n"
import { useDateGame } from "@/hooks/use-date-game"
import { GameCardContainer, QuestionDisplay, ResultDisplay, ActionBar } from "@/components/game/primitives"

interface DateGameCardProps {
  mode: DateMode
  onScoreUpdate: (score: number, streak: number, correct: boolean) => void
  disableNext?: boolean
}

export function DateGameCard({ mode, onScoreUpdate, disableNext = false }: DateGameCardProps) {
  const { t } = useI18n()
  const {
    question,
    userInput,
    setUserInput,
    showResult,
    isCorrect,
    showNumbers,
    setShowNumbers,
    inputRef,
    handleSubmit,
    handleSkip,
    handleKeyDown,
    handleKeyUp,
    generateNewQuestion,
  } = useDateGame({ mode, onScoreUpdate, disableNext, t })

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

  const getPromptText = () => {
    switch (mode) {
      case "full":
        return t("writeFullDate")
      case "months":
        return t("writeMonthReading")
      case "week_days":
        return t("writeWeekDay")
    }
  }

  const handleInputChange = (value: string) => {
    if (showResult) return
    setUserInput(value)
  }

  const displayValue = mode === "months" && showNumbers ? question.displayNumber : question.display
  const displayLang = mode === "months" && showNumbers ? undefined : "ja"

  // Map feedback state for GameCardContainer
  const feedback = showResult ? (isCorrect ? "correct" : "incorrect") : null

  return (
    <GameCardContainer feedback={feedback}>
      {/* Mode Toggle Button (for months/week_days) */}
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

      {/* Question Display */}
      <QuestionDisplay
        value={displayValue || ""}
        prompt={getPromptText()}
        lang={displayLang}
        icon={getModeIcon()}
      />

      {/* Input Section */}
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

      {/* Result Display */}
      {showResult && (
        <div className="mb-4">
          <ResultDisplay
            isCorrect={isCorrect}
            expectedAnswer={question.answer}
            userAnswer={userInput}
            romaji={question.romaji}
            additionalInfo={question.kanji && <p lang="ja" className="text-lg text-primary">{question.kanji}</p>}
            t={t}
          />
        </div>
      )}

      {/* Action Bar */}
      <ActionBar
        showResult={showResult}
        onSubmit={handleSubmit}
        onNext={() => { if (!disableNext) generateNewQuestion() }}
        onSkip={handleSkip}
        submitDisabled={!userInput.trim()}
        nextDisabled={disableNext}
        nextLabel={t("nextDate")}
        t={t}
      />
    </GameCardContainer>
  )
}
