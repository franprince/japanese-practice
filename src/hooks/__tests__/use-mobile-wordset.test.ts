import { StrictMode } from "react"
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useMobileWordset } from "../use-mobile-wordset"
import { WordsetAcquisition, type WordsetFetch } from "@/lib/japanese/wordsets"
import { fixtureManifest } from "@/test/wordset-fixture"
import type { WordSets } from "@/types/api"
import type { Language } from "@/lib/i18n"

const data: WordSets = { version: 1, hiraganaWords: [], katakanaWords: [] }
const originalFetch = globalThis.fetch
const originalMatchMedia = window.matchMedia
beforeEach(() => {
    window.matchMedia = (query: string) => ({ matches: query.includes("max-width: 768px") }) as MediaQueryList
    globalThis.fetch = mock(async () => new Response(JSON.stringify(fixtureManifest(data)))) as unknown as typeof fetch
})
afterEach(() => {
    globalThis.fetch = originalFetch
    window.matchMedia = originalMatchMedia
})

function harness() {
    const saved = new Map<string, WordSets>()
    const fetcher = mock<WordsetFetch>(async () => new Response(JSON.stringify(data)))
    const confirmation = mock((_lang: string, _value: boolean) => {})
    const service = new WordsetAcquisition({
        storage: {
            read: async lang => saved.get(lang),
            write: async (lang, value) => { saved.set(lang, value) },
            remove: async lang => { saved.delete(lang) },
        },
        fetch: (input, init) => String(input).endsWith("manifest.json") ? Promise.resolve(new Response(JSON.stringify(fixtureManifest(data)))) : fetcher(input, init), mobile: () => true, confirmation,
    })
    return { service, fetcher, confirmation, saved }
}
async function openWords(result: { current: ReturnType<typeof useMobileWordset> }) {
    await waitFor(() => expect(result.current.busy).toBe(false))
    act(() => result.current.setGameType("words"))
    await waitFor(() => {
        expect(result.current.mobileConfirmOpen).toBe(true)
        expect(result.current.busy).toBe(false)
    })
}

describe("mobile acquisition UI", () => {
    test("uses manifest byte metadata for consent size without downloading", async () => {
        const manifest = fixtureManifest(data)
        manifest.datasets.en.bytes = 12 * 1024 * 1024
        globalThis.fetch = mock(async () => new Response(JSON.stringify(manifest))) as unknown as typeof fetch
        const h = harness()
        const { result } = renderHook(() => useMobileWordset("en", h.service))
        await openWords(result)
        await waitFor(() => expect(result.current.wordsetSizeMB).toBe(12))
        expect(h.fetcher).not.toHaveBeenCalled()
    })

    test("guess mode remains available without downloading a wordset", async () => {
        const h = harness()
        const { result } = renderHook(() => useMobileWordset("en", h.service))
        await waitFor(() => expect(result.current.busy).toBe(false))
        act(() => result.current.setGameType("guess"))
        expect(result.current.gameType).toBe("guess")
        expect(h.fetcher).not.toHaveBeenCalled()
    })
    test("failure keeps characters and the modal; retry activates words only after saving", async () => {
        const h = harness()
        h.fetcher.mockImplementationOnce(async () => new Response(null, { status: 503 }))
        const { result } = renderHook(() => useMobileWordset("en", h.service))
        await openWords(result)
        expect(h.fetcher).not.toHaveBeenCalled()
        await act(async () => { await result.current.confirmWordMode() })
        expect(result.current.downloadError).toBe("words.downloadError.http")
        expect(result.current.mobileConfirmOpen).toBe(true)
        expect(result.current.gameType).toBe("characters")
        expect(h.confirmation).not.toHaveBeenCalledWith("en", true)
        await act(async () => { await result.current.confirmWordMode() })
        expect(result.current.downloadError).toBeNull()
        expect(result.current.mobileConfirmOpen).toBe(false)
        expect(result.current.gameType).toBe("words")
        expect(h.saved.get("en")).toMatchObject(data)
    })
    test("cancels a pending download and ignores a late response", async () => {
        const h = harness()
        let respond!: (response: Response) => void
        h.fetcher.mockImplementation(() => new Promise(resolve => { respond = resolve }))
        const { result } = renderHook(() => useMobileWordset("en", h.service))
        await openWords(result)
        let pending!: Promise<void>
        act(() => { pending = result.current.confirmWordMode() })
        await waitFor(() => expect(h.fetcher).toHaveBeenCalledTimes(1))
        expect(result.current.busy).toBe(true)
        expect(result.current.downloadProgress).toBeNull()
        await act(async () => { result.current.cancelConfirm(); await pending })
        expect(h.fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
        await act(async () => { respond(new Response(JSON.stringify(data))); await new Promise(resolve => setTimeout(resolve, 0)) })
        expect(result.current.gameType).toBe("characters")
        expect(result.current.mobileConfirmOpen).toBe(false)
        expect(h.saved.size).toBe(0)
    })
    test("language switching aborts obsolete work and clears errors and progress", async () => {
        const h = harness()
        h.fetcher.mockImplementationOnce((_input, options) => new Promise((_resolve, reject) => {
            options?.signal?.addEventListener("abort", () => reject(options.signal?.reason))
        }))
        const { result, rerender } = renderHook(({ lang }: { lang: Language }) => useMobileWordset(lang, h.service), { initialProps: { lang: "en" as Language } })
        await openWords(result)
        act(() => { void result.current.confirmWordMode() })
        await waitFor(() => expect(h.fetcher).toHaveBeenCalledTimes(1))
        rerender({ lang: "es" })
        await waitFor(() => expect(result.current.busy).toBe(false))
        expect(h.fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
        expect(result.current.downloadProgress).toBeNull()
        expect(result.current.downloadError).toBeNull()
        expect(result.current.gameType).toBe("characters")
        expect(result.current.wordsetSizeMB).toBe(0)
        await act(async () => { await result.current.confirmWordMode() })
        expect(h.saved.has("es")).toBe(true)
        expect(h.saved.has("en")).toBe(false)
        expect(result.current.gameType).toBe("words")
    })
    test("English and Japanese share cached availability without a second download", async () => {
        const h = harness()
        const { result, rerender } = renderHook(({ lang }: { lang: Language }) => useMobileWordset(lang, h.service), { initialProps: { lang: "en" as Language } })
        await openWords(result)
        await act(async () => { await result.current.confirmWordMode() })
        rerender({ lang: "ja" })
        expect(result.current.gameType).toBe("words")
        expect(h.fetcher).toHaveBeenCalledTimes(1)
    })
    test("cancel after failure closes the modal without enabling words", async () => {
        const h = harness()
        h.fetcher.mockImplementation(async () => { throw new Error("offline") })
        const { result } = renderHook(() => useMobileWordset("en", h.service))
        await openWords(result)
        await act(async () => { await result.current.confirmWordMode() })
        act(() => result.current.cancelConfirm())
        expect(result.current.mobileConfirmOpen).toBe(false)
        expect(result.current.gameType).toBe("characters")
        expect(result.current.downloadError).toBeNull()
    })
    test("unmount aborts a pending download", async () => {
        const h = harness()
        h.fetcher.mockImplementation((_input, options) => new Promise((_resolve, reject) => {
            options?.signal?.addEventListener("abort", () => reject(options.signal?.reason))
        }))
        const { result, unmount } = renderHook(() => useMobileWordset("en", h.service))
        await openWords(result)
        act(() => { void result.current.confirmWordMode() })
        await waitFor(() => expect(h.fetcher).toHaveBeenCalledTimes(1))
        unmount()
        expect(h.fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
    })
})


test("acquisition snapshots are stable while idle and Strict Mode never downloads without consent", async () => {
    const h = harness()
    expect(h.service.state("en")).toBe(h.service.state("ja"))
    expect(h.service.state("es")).toBe(h.service.state("es"))
    const { result } = renderHook(() => useMobileWordset("en", h.service), { wrapper: StrictMode })
    await waitFor(() => expect(result.current.busy).toBe(false))
    expect(result.current.gameType).toBe("characters")
    expect(result.current.mobileConfirmOpen).toBe(false)
    expect(h.fetcher).not.toHaveBeenCalled()
})
