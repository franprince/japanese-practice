"use client";

import React, { useState } from "react";
import type { QuizQuestion } from "@/lib/core/ollama";
import { FuriganaText } from "@/components/ui/furigana-text";

// Extended interface if id exists from DB
export type DbQuizQuestion = QuizQuestion & { id?: number };

interface QuizEngineProps {
  questions: DbQuizQuestion[];
  onComplete?: (score: number, total: number) => void;
  onRestart?: () => void;
  onAnswerChecked?: (questionId: number, isFailed: boolean) => void;
}

export function QuizEngine({ questions, onComplete, onRestart, onAnswerChecked }: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (!questions || questions.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No questions available.</div>;
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const parts = currentQuestion.question.split("___");
  const hasBlank = parts.length > 1;

  const handleOptionSelect = (index: number) => {
    if (showExplanation) return; // Prevent changing answer after revealing
    setSelectedOptionIndex(index);
  };

  const checkAnswer = () => {
    if (selectedOptionIndex === null) return;
    
    setShowExplanation(true);
    const isCorrect = selectedOptionIndex === currentQuestion.answerIndex;
    if (isCorrect) {
      setScore((s) => s + 1);
    }

    if (onAnswerChecked && currentQuestion.id) {
        onAnswerChecked(currentQuestion.id, !isCorrect);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setIsFinished(true);
      if (onComplete) {
        onComplete(score, questions.length);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setShowExplanation(false);
    }
  };

  /**
   * Results View
   */
  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    let message = "Keep practicing!";
    let icon = "🎯";

    if (percentage === 100) {
      message = "Perfect Score! You're amazing!";
      icon = "🏆";
    } else if (percentage >= 80) {
      message = "Excellent work!";
      icon = "🌟";
    } else if (percentage >= 50) {
      message = "Good effort, keep it up!";
      icon = "👍";
    }

    return (
      <div className="bg-card text-card-foreground rounded-xl border-2 border-primary/20 shadow-xl max-w-2xl mx-auto p-12 text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="space-y-4">
          <div className="text-7xl animate-bounce mb-6">{icon}</div>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {message}
          </h2>
          <p className="text-xl text-muted-foreground">Challenge completed successfully.</p>
        </div>
        
        <div className="py-10 bg-muted/30 rounded-2xl border border-primary/10 transition-all hover:scale-105 duration-300">
          <div className="text-8xl font-black text-primary mb-2 drop-shadow-sm">
            {score} <span className="text-4xl text-muted-foreground">/ {questions.length}</span>
          </div>
          <div className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground">Final Score</div>
        </div>

        <div className="pt-4 space-y-4">
          <button
            onClick={onRestart}
            className="w-full max-w-sm inline-flex items-center justify-center rounded-lg text-lg font-bold transition-all bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] h-14 px-8"
          >
            Play Again
          </button>
          {onRestart && (
            <button
              onClick={onRestart}
              className="w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Back to Settings
            </button>
          )}
        </div>
      </div>
    );
  }

  // Helper to format options for dropdowns which don't support <ruby>
  const formatOption = (str: string) => str.replace(/([一-龯ぁ-んァ-ン]+)\s*\[([ぁ-んァ-ン]+)\]/g, "$1 ($2)");

  return (
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm max-w-2xl mx-auto overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-muted p-4 border-b flex justify-between items-center text-sm font-medium">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <span>Score: {score} / {currentIndex + (showExplanation ? 1 : 0)}</span>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        <h3 className="text-xl md:text-2xl font-medium leading-[2.8] tracking-wide whitespace-pre-line" lang="ja">
          {(() => {
            if (!hasBlank) return <FuriganaText text={currentQuestion.question} />;
            
            return parts.map((part, index) => (
              <React.Fragment key={index}>
                <FuriganaText text={part} />
                {index < parts.length - 1 && (
                  <select
                    className={`inline-block mx-1.5 text-base md:text-lg border-b-2 bg-transparent focus:outline-none transition-colors min-w-[4rem] py-0 leading-none align-baseline translate-y-[0.15em]
                      ${showExplanation 
                        ? (selectedOptionIndex === currentQuestion.answerIndex 
                            ? "border-green-500 text-green-700 font-bold" 
                            : "border-red-500 text-red-700 font-bold")
                        : "border-primary cursor-pointer hover:border-primary/70 text-card-foreground"
                      }`}
                    value={selectedOptionIndex ?? ""}
                    onChange={(e) => handleOptionSelect(Number(e.target.value))}
                    disabled={showExplanation}
                  >
                    <option value="" disabled></option>
                    {currentQuestion.options.map((opt, optIdx) => {
                      // Split option by comma (handles both half-width and full-width)
                      const optParts = opt.split(/[,，]\s*/);
                      const displayValue = optParts.length > index ? optParts[index] : opt;
                      
                      return (
                        <option key={optIdx} value={optIdx} className="text-black bg-white">
                          {formatOption(displayValue || "")}
                        </option>
                      );
                    })}
                  </select>
                )}
              </React.Fragment>
            ));
          })()}
        </h3>

        {!hasBlank && (
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              let buttonStyle = "border-border bg-background hover:bg-accent hover:text-accent-foreground";
              
              if (showExplanation) {
                if (idx === currentQuestion.answerIndex) {
                  // Correct answer is always green
                  buttonStyle = "border-green-500 bg-green-50 text-green-900 border-2 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                } else if (idx === selectedOptionIndex) {
                  // Wrong selected answer is red
                  buttonStyle = "border-red-500 bg-red-50 text-red-900 border-2";
                } else {
                  // Other options are greyed out
                  buttonStyle = "border-border bg-muted/50 text-muted-foreground opacity-60";
                }
              } else if (selectedOptionIndex === idx) {
                // Selected before checking
                buttonStyle = "border-primary bg-primary/10 ring-2 ring-primary ring-offset-background";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  className={`w-full text-left p-4 rounded-xl border text-base md:text-lg transition-all duration-200 ${buttonStyle}`}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={showExplanation}
                  lang="ja"
                >
                  <FuriganaText text={option} />
                </button>
              );
            })}
          </div>
        )}

        {showExplanation && (
          <div className={`p-6 rounded-xl mt-6 space-y-4 animate-in slide-in-from-top-2 duration-300 ${selectedOptionIndex === currentQuestion.answerIndex ? 'bg-green-100/40 border border-green-200 text-green-900' : 'bg-red-100/40 border border-red-200 text-red-900'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${selectedOptionIndex === currentQuestion.answerIndex ? 'bg-green-600 text-white shadow-sm' : 'bg-red-600 text-white shadow-sm'}`}>
                {selectedOptionIndex === currentQuestion.answerIndex ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Translation</p>
                <p className="text-base font-semibold leading-relaxed tracking-tight">{currentQuestion.meaning}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Grammar Note</p>
                <p className="text-sm italic font-medium opacity-90"><FuriganaText text={currentQuestion.explanation} /></p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-muted/50 flex justify-end gap-3 border-t">
        {!showExplanation ? (
          <button
            onClick={checkAnswer}
            disabled={selectedOptionIndex === null}
            className="inline-flex items-center justify-center rounded-lg text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 h-10 px-6 py-2"
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="inline-flex items-center justify-center rounded-lg text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 h-10 px-6 py-2 animate-in fade-in slide-in-from-right-2"
          >
             {isLastQuestion ? "Finish Quiz" : "Next Question"}
          </button>
        )}
      </div>
    </div>
  );
}
