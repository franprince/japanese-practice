import { useState, useEffect } from "react";

export interface QuizProgress {
  seenIds: number[];
  failedIds: number[];
}

export function useQuizProgress() {
  const [progress, setProgress] = useState<QuizProgress>({ seenIds: [], failedIds: [] });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("ollama-quiz-progress");
    if (data) {
      try {
        setProgress(JSON.parse(data));
      } catch (e) {
        console.error("Failed to parse quiz progress", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveProgress = (newProgress: QuizProgress) => {
    setProgress(newProgress);
    localStorage.setItem("ollama-quiz-progress", JSON.stringify(newProgress));
  };

  const markSeen = (id: number, failed: boolean) => {
    const newSeen = new Set(progress.seenIds);
    const newFailed = new Set(progress.failedIds);

    newSeen.add(id);

    if (failed) {
      newFailed.add(id);
    } else {
      newFailed.delete(id); // If they answer correctly later, remove from failed
    }

    saveProgress({
      seenIds: Array.from(newSeen),
      failedIds: Array.from(newFailed)
    });
  };
  
  const resetProgress = () => {
    saveProgress({ seenIds: [], failedIds: [] });
  };

  return { progress, markSeen, resetProgress, isLoaded };
}
