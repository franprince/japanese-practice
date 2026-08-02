import { describe, expect, it, mock } from "bun:test"
import { renderHook, act } from "@testing-library/react"
import type { JapaneseWord } from "@/types/japanese"

type Resolver = (word: JapaneseWord) => void
let resolvers: Resolver[] = []

mock.module("@/lib/japanese/words", () => ({
    getRandomWord: mock(() => new Promise<JapaneseWord>((resolve) => { resolvers.push(resolve) })),
    getRandomCharacter: mock(() => new Promise<JapaneseWord>((resolve) => { resolvers.push(resolve) })),
}))

mock.module("@/lib/japanese/words/loader", () => ({
    confirmWordset: mock(),
    normalizeLang: mock((lang: string) => lang),
}))

const { useWordGame } = await import("../use-word-game")

const word = (romaji: string): JapaneseWord => ({
    kana: romaji,
    romaji,
    type: "hiragana",
    groups: [],
})

describe("useWordGame race condition", () => {
    it("keeps the result of the most recent loadNewWord call, discarding an out-of-order earlier response", async () => {
        resolvers = []

        const { result } = renderHook(() =>
            useWordGame({
                mode: "hiragana",
                filter: { selectedGroups: [], minLength: 1, maxLength: 6 },
                gameType: "words",
                disableNext: false,
                suppressFocus: true,
                lang: "es",
                onScoreUpdate: mock(),
            })
        )

        // Mount's own effect already triggered the first loadNewWord() call.
        expect(resolvers.length).toBe(1)

        // A second, overlapping call — e.g. a double-clicked Next button.
        await act(async () => {
            void result.current.loadNewWord()
        })
        expect(resolvers.length).toBe(2)

        // Resolve out of order: the *second* call's word arrives first...
        await act(async () => {
            resolvers[1]!(word("second"))
        })
        // ...then the stale first call resolves afterwards.
        await act(async () => {
            resolvers[0]!(word("first"))
        })

        // The later call must win — the stale "first" response is discarded.
        expect(result.current.currentWord?.romaji).toBe("second")
    })
})
