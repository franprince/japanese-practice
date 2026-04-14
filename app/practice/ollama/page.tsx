"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { curriculum } from "@/lib/japanese/curriculum";
import { UnitSelector } from "@/components/quiz/unit-selector";
import { QuizEngine } from "@/components/quiz/quiz-engine";
import type { DbQuizQuestion } from "@/components/quiz/quiz-engine";
import { useQuizProgress } from "@/hooks/use-quiz-progress";

export default function OllamaPracticePage() {
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([1]); // Default select unit 1
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<DbQuizQuestion[] | null>(null);
  
  const { progress, markSeen, isLoaded } = useQuizProgress();

  const handleGenerate = async () => {
    if (selectedUnitIds.length === 0) {
      setError("Please select at least one unit to practice.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setQuestions(null);

    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedUnitIds: selectedUnitIds,
          seenIds: progress.seenIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to fetch quizzes");
      }

      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        setError("No new quizzes found! We are generating more in the background, please wait a minute and try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuizComplete = (score: number, total: number) => {
    console.log(`Quiz complete! Score: ${score}/${total}`);
  };

  const handleRestart = () => {
    setQuestions(null);
    setError(null);
  };

  if (!isLoaded) return null;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">AI Japanese Practice</h1>
        <p className="text-muted-foreground">
          Dynamic exercises tailored to your selected units, synced with your progress.
        </p>
      </div>

      {!questions ? (
        <div className="space-y-6">
          <UnitSelector
            units={curriculum}
            selectedUnitIds={selectedUnitIds}
            onChange={setSelectedUnitIds}
            disabled={isGenerating}
          />

          {error && (
             <div className="p-4 rounded-md bg-destructive/15 text-destructive border border-destructive/20 text-sm">
                {error}
             </div>
          )}

          <div className="flex justify-end">
             <button
                onClick={handleGenerate}
                disabled={isGenerating || selectedUnitIds.length === 0}
                className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 py-2 text-base"
             >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching Quizzes...
                  </>
                ) : (
                  "Start 10-Question Challenge"
                )}
             </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
           <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Quiz Mode</h2>
              <button
                onClick={handleRestart}
                className="text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Back to Settings
              </button>
           </div>
           
           <QuizEngine
             questions={questions}
             onComplete={handleQuizComplete}
             onRestart={handleRestart}
             onAnswerChecked={markSeen}
           />
        </div>
      )}
    </div>
  );
}
