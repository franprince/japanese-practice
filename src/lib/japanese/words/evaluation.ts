/** Answer correctness and diagnostics; session admission remains in the hook. */
import type { WordsGameType } from "@/types/game"
import type { JapaneseWord, ErrorDetectionResult } from "@/types/japanese"
import { validateAnswer } from "../shared/input"
import { detectErrors } from "../shared/error-detection"

export interface WordAnswerEvaluation {
  isCorrect: boolean
  errorDetails: ErrorDetectionResult | null
  diagnosticError?: unknown
}

export function evaluateWordAnswer(
  word: JapaneseWord, answer: string, gameType: WordsGameType,
  detect: typeof detectErrors = detectErrors,
): WordAnswerEvaluation | Promise<WordAnswerEvaluation> {
  const input = answer.trim()
  const isCorrect = validateAnswer(input, word)
  // Preserve synchronous admission for direct matches and all Guess answers.
  if (isCorrect || gameType === "guess") return { isCorrect, errorDetails: null }
  return evaluateDiagnostics(word.kana, input, detect)
}

async function evaluateDiagnostics(
  kana: string, input: string, detect: typeof detectErrors,
): Promise<WordAnswerEvaluation> {
  try {
    const details = await detect(kana, input)
    return { isCorrect: details.isFullyCorrect, errorDetails: details.isFullyCorrect ? null : details }
  } catch (diagnosticError) {
    return { isCorrect: false, errorDetails: null, diagnosticError }
  }
}
