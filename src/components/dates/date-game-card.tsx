"use client"

import type React from "react"

import { Check, X, CalendarDays, Calendar, Hash, Type } from "lucide-react"
import type { DateMode } from "@/lib/japanese/dates"
import { useI18n } from "@/lib/i18n"
import { useDateGame } from "@/hooks/use-date-game"
import { GameCardContainer, QuestionDisplay, AnswerSection, ResultDisplay, ActionBar } from "@/components/game/primitives"
import { Input } from "@/components/ui/input"

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

  const displayValue = (mode === "months" && showNumbers ? question.displayNumber : question.display) || ""

  return (
    <GameCardContainer feedback={showResult ? (isCorrect ? "correct" : "incorrect") : null}>
      {/* Number/Name toggle for months and week_days */}
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

      <QuestionDisplay
        value={displayValue}
        prompt={getModeLabel()}
        icon={getModeIcon()}
      />

      <p className="text-sm text-muted-foreground text-center mb-6">{getPromptText()}</p>

      <AnswerSection>
        <Input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          readOnly={showResult}
          aria-disabled={showResult}
          placeholder={t("typeHiraganaOrRomaji")}
          className="text-center text-lg"
        />

        {showResult && (
          <ResultDisplay
            isCorrect={isCorrect}
            expectedAnswer={question.answer}
            userAnswer={userInput}
            romaji={question.romaji}
            additionalInfo={
              question.kanji ? <p lang="ja" className="text-lg text-primary">{question.kanji}</p> : undefined
            }
            t={t}
          />
        )}
      </AnswerSection>

      <ActionBar
        showResult={showResult}
        onSubmit={handleSubmit}
        onNext={generateNewQuestion}
        onSkip={handleSkip}
        submitDisabled={!userInput.trim()}
        nextDisabled={disableNext}
        nextLabel={t("nextDate")}
        t={t}
      />
    </GameCardContainer>
  )
}
