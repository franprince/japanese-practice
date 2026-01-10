"use client"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { difficultyRanges, type Difficulty } from "@/lib/japanese-numbers"

interface DifficultySelectorProps {
    difficulty: Difficulty
    onDifficultyChange: (difficulty: Difficulty) => void
}

export function DifficultySelector({ difficulty, onDifficultyChange }: DifficultySelectorProps) {
    const { t } = useI18n()

    const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"]

    return (
        <div className="flex flex-wrap justify-center gap-2">
            {difficulties.map((d) => (
                <Button
                    key={d}
                    variant={difficulty === d ? "default" : "outline"}
                    onClick={() => onDifficultyChange(d)}
                    className={`px-4 py-2 text-sm transition-all ${difficulty === d
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "hover:bg-primary/10 hover:border-primary/50"
                        }`}
                >
                    <span className="font-medium">{t(d)}</span>
                    <span className="ml-2 text-xs opacity-70">({difficultyRanges[d].label})</span>
                </Button>
            ))}
        </div>
    )
}
