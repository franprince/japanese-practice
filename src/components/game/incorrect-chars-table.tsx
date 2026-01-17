export interface IncorrectCharsTableProps {
    incorrectChars: Map<string, { count: number; romaji: string }>
    tableCharacterLabel: string
    tableErrorsLabel: string
    maxItems?: number
}

export function IncorrectCharsTable({
    incorrectChars,
    tableCharacterLabel,
    tableErrorsLabel,
    maxItems = 3,
}: IncorrectCharsTableProps) {
    // Sort by occurrence count (highest first) and limit to maxItems
    const sortedChars = Array.from(incorrectChars.entries())
        .sort(([, a], [, b]) => {
            const countA = typeof a === 'object' ? a.count : (typeof a === 'number' ? a : 0)
            const countB = typeof b === 'object' ? b.count : (typeof b === 'number' ? b : 0)
            return countB - countA
        })
        .slice(0, maxItems)

    if (sortedChars.length === 0) return null

    return (
        <div className="max-h-40 overflow-y-auto mx-auto max-w-xs">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-xs text-muted-foreground uppercase">
                        <th className="py-1 text-left pl-4">{tableCharacterLabel}</th>
                        <th className="py-1 text-right pr-4">{tableErrorsLabel}</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedChars.map(([kana, data]) => {
                        const count = typeof data === 'object' ? data.count : (typeof data === 'number' ? data : 1)
                        const romaji = typeof data === 'object' ? data.romaji : ''
                        return (
                            <tr key={kana} className="border-t border-border/20">
                                <td className="py-2 text-left pl-4 font-mono text-lg text-destructive">
                                    {kana} {romaji && <span className="text-sm opacity-70">({romaji})</span>}
                                </td>
                                <td className="py-2 text-right pr-4 tabular-nums text-muted-foreground">×{count}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
