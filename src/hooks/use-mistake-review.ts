import { useCallback, useState } from "react"

export interface PracticeReviewProps<Question> {
  reviewQuestions?: readonly Question[]
  onQuestionMissed?: (question: Question) => void
}

// Questions stay typed and local to their feature; scoring remains in the session reducer.
const serialize = (value: unknown) => JSON.stringify(value)
export function useMistakeReview<Question>(sessionId: number, questionKey: (question: Question) => string = serialize) {
  const [missed, setMissed] = useState<{ sessionId: number; items: Question[] }>({ sessionId, items: [] })
  const [review, setReview] = useState<{ questions: readonly Question[]; originalTarget: number } | null>(null)
  const missedQuestions = missed.sessionId === sessionId ? missed.items : []
  const onQuestionMissed = useCallback((question: Question) => {
    setMissed(previous => {
      // A stale callback cannot overwrite questions recorded by a later session.
      if (previous.sessionId > sessionId) return previous
      const items = previous.sessionId === sessionId ? previous.items : []
      const key = questionKey(question)
      return items.some(item => questionKey(item) === key) ? previous : { sessionId, items: [...items, question] }
    })
  }, [sessionId, questionKey])
  const clearReview = useCallback(() => setReview(null), [])
  const beginReview = () => {
    if (!missedQuestions.length) return null
    return missedQuestions
  }
  return { missedQuestions, onQuestionMissed, review, setReview, clearReview, beginReview }
}
