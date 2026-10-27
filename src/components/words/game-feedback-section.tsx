import { cn } from "@/lib/core"
import { Check, X } from "lucide-react"
import type { JapaneseWord } from "@/lib/japanese/words"
import type { ErrorDetectionResult } from "@/lib/japanese/shared"
import type { TranslationKey } from "@/lib/i18n"

export interface GameFeedbackSectionProps {
    feedback: "correct" | "incorrect" | null
    displayRomaji: string
    currentWord: JapaneseWord
    errorDetails: ErrorDetectionResult | null
    gameType: "words" | "characters" | "guess"
    t: (key: TranslationKey) => string
}

export function GameFeedbackSection({
    feedback,
    displayRomaji,
    currentWord,
    errorDetails,
    t,
}: GameFeedbackSectionProps) {
    if (!feedback) return null

    return (
        <div role="status" aria-live="polite" aria-atomic="true" className="space-y-3 rounded-xl border bg-background p-4 text-center">
            <div className="flex items-center justify-center gap-4">
                {feedback === "correct" && <span lang="ja" aria-hidden="true" className="hanko notebook-only size-16 shrink-0 text-3xl">正</span>}
                <p className={cn("font-hand text-lg font-semibold", feedback === "correct" ? "text-success" : "text-destructive")}>{t(feedback === "correct" ? "correct" : "incorrect")}</p>
            </div>
            {(
                <div className="relative z-10">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{t("correctAnswer")}</p>
                    <p className="answer-ink break-words font-hand text-2xl font-semibold text-foreground [overflow-wrap:anywhere]">
                        {displayRomaji || currentWord.romaji}
                    </p>
                </div>
            )}

            {feedback === "incorrect" && errorDetails && errorDetails.characters.length > 0 && (
                <div className="pt-3 border-t border-border/30">
                    <p className="text-xs text-muted-foreground mb-2 ">{t("yourAnswer") || "Your Answer"}</p>
                    <div className="flex flex-wrap justify-center gap-1">
                        {errorDetails.characters.map((char, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex flex-col items-center px-2 py-1 rounded-md text-sm font-mono",
                                    char.isCorrect
                                        ? "bg-success/20 text-success border border-success/30"
                                        : "bg-destructive/20 text-destructive border border-destructive/30"
                                )}
                            >
                                <span lang="ja" className="text-lg">{char.kana}</span>
                                <span className="break-all text-xs opacity-80">
                                    {char.userInput || "—"}
                                    {!char.isCorrect && char.expectedRomaji[0] && (
                                        <span className="text-muted-foreground"> → {char.expectedRomaji[0]}</span>
                                    )}
                                </span>
                            </div>
                        ))}
                        {errorDetails.extraInput && (
                            <div
                                className="flex flex-col items-center px-2 py-1 rounded-md text-sm font-mono bg-destructive/20 text-destructive border border-destructive/30"
                            >
                                <span className="text-lg">?</span>
                                <span className="break-all text-xs opacity-80">{errorDetails.extraInput}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {currentWord.meaning && (
                <div className="pt-2 border-t border-border/30">
                    <p className="text-xs text-muted-foreground mb-1 ">{t("meaning")}</p>
                    <p className="text-base text-foreground/90">{currentWord.meaning}</p>
                </div>
            )}

            {currentWord.kanji && (
                <div className="pt-2 border-t border-border/30">
                    <p className="text-xs text-muted-foreground mb-1 ">{t("word")}</p>
                    <p lang="ja" className="text-lg font-medium text-foreground">{currentWord.kanji}</p>
                    <a
                        href={`https://jisho.org/search/${encodeURIComponent(currentWord.kanji)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs text-primary hover:underline"
                    >
                        {t("showMeaning")}
                    </a>
                </div>
            )}
        </div>
    )
}

export function FeedbackIcon({ feedback }: { feedback: "correct" | "incorrect" | null }) {
    if (!feedback) return null

    return (
        <div
            className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2",
                feedback === "correct" ? "text-success" : "text-destructive"
            )}
        >
            {feedback === "correct" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </div>
    )
}
