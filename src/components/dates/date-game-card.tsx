"use client"
import type { PracticeReviewProps } from "@/hooks/use-mistake-review"
import type { DateQuestion } from "@/lib/japanese/dates"

import type { GameSessionProps } from "@/lib/core/game-session"

import type React from "react"
import { Calendar, CalendarDays, Hash, Type } from "lucide-react"
import type { DateMode } from "@/lib/japanese/dates"
import { useI18n } from "@/lib/i18n"
import { useDateGame } from "@/hooks/use-date-game"
import { GameCardContainer, QuestionDisplay, ResultDisplay, ActionBar } from "@/components/game/primitives"

interface DateGameCardProps extends GameSessionProps, PracticeReviewProps<DateQuestion> {
  mode: DateMode
  disableNext?: boolean
}

export function DateGameCard({ mode, sessionId, onSessionEvent, disableNext = false, reviewQuestions, onQuestionMissed }: DateGameCardProps) {
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
    generateNewQuestion,
  } = useDateGame({ mode, sessionId, onSessionEvent, disableNext, t, reviewQuestions, onQuestionMissed })

  if (!question) return null

  const getModeIcon = () => {
    switch (mode) {
      case "week_days":
        return <CalendarDays className="w-5 h-5 text-primary" />
      case "full":
        return <Calendar className="w-5 h-5 text-primary" />
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
    if (showResult || disableNext) return
    setUserInput(value)
  }

  const usesNumberToggle = mode === "months" || mode === "week_days"
  const displayValue = usesNumberToggle && showNumbers ? question.displayNumber : question.display
  const displayLang = usesNumberToggle && showNumbers ? undefined : "ja"

  
  const feedback = showResult ? (isCorrect ? "correct" : "incorrect") : null

  return (
    <GameCardContainer feedback={feedback}>
      {(mode === "months" || mode === "week_days") && (
        <div className="mb-2 flex justify-end">
          <button
            onClick={() => setShowNumbers(!showNumbers)}
            aria-pressed={showNumbers}
            className="min-h-11 min-w-11 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title={showNumbers ? t("showName") || "Show Name" : t("showNumber") || "Show Number"}
          >
            {showNumbers ? <Type className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
          </button>
        </div>
      )}

      <QuestionDisplay
        value={displayValue || ""}
        prompt={getPromptText()}
        lang={displayLang}
        icon={getModeIcon()}
      />

      <div className="mb-4">
        <label htmlFor="date-answer" className="mb-2 block text-sm font-medium">{t("practice.dateLabel")}</label>
        <input
          id="date-answer"
          aria-invalid={showResult && !isCorrect}
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => handleInputChange(e.target.value)}
          readOnly={showResult || disableNext}
          aria-disabled={showResult || disableNext}
          placeholder={t("typeHiraganaOrRomaji")}
          className={`
            w-full px-4 py-3 text-lg text-center rounded-xl border-2 bg-background
            placeholder:text-muted-foreground/50 focus:outline-none transition-all
            ${showResult || disableNext ? "border-border opacity-60" : "border-border focus:border-primary"}
          `}
        />
      </div>

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

      <ActionBar
        showResult={showResult}
        onSubmit={handleSubmit}
        onNext={generateNewQuestion}
        onSkip={handleSkip}
        submitDisabled={disableNext || !userInput.trim()}
        skipDisabled={disableNext}
        nextDisabled={disableNext}
        nextLabel={t("nextDate")}
        t={t}
      />
    </GameCardContainer>
  )
}
