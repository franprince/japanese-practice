import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"
import type { JapaneseWord } from "@/lib/japanese-words"
import type { ErrorDetectionResult } from "@/lib/error-detection"
import type { TranslationKey } from "@/lib/translations"

export interface GameFeedbackSectionProps {
    feedback: "correct" | "incorrect" | null
    displayRomaji: string
    currentWord: JapaneseWord
    errorDetails: ErrorDetectionResult | null
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
        <div className="text-center p-4 bg-secondary/50 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200 border border-border/50 space-y-2">
            {/* Correct answer display */}
            <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t("correctAnswer")}</p>
                <p className="text-xl font-mono font-semibold text-primary">{displayRomaji || currentWord.romaji}</p>
            </div>

            {/* Character-level error feedback */}
            {feedback === "incorrect" && errorDetails && errorDetails.characters.length > 0 && (
                <div className="pt-3 border-t border-border/30">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{t("yourAnswer") || "Your Answer"}</p>
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
                                <span className="text-xs opacity-80">
                                    {char.userInput || "—"}
                                    {!char.isCorrect && char.expectedRomaji[0] && (
                                        <span className="text-muted-foreground"> → {char.expectedRomaji[0]}</span>
                                    )}
                                </span>
                            </div>
                        ))}
                        {/* Show extra unmatched input as error */}
                        {errorDetails.extraInput && (
                            <div
                                className="flex flex-col items-center px-2 py-1 rounded-md text-sm font-mono bg-destructive/20 text-destructive border border-destructive/30"
                            >
                                <span className="text-lg">?</span>
                                <span className="text-xs opacity-80">{errorDetails.extraInput}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Word meaning */}
            {currentWord.meaning && (
                <div className="pt-2 border-t border-border/30">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t("meaning")}</p>
                    <p className="text-base text-foreground/90">{currentWord.meaning}</p>
                </div>
            )}

            {/* Kanji with Jisho link */}
            {currentWord.kanji && (
                <div className="pt-2 border-t border-border/30">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t("word")}</p>
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
