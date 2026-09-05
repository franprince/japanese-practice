import { describe, expect, test, mock } from "bun:test"
import {
  cacheTransaction, ConsentRequired, downloadWordset, normalizeLang,
  validateWordset, WordsetAcquisition, WordsetError,
  type AcquisitionState, type WordsetEvent, type WordsetFetch, type WordsetStorage,
} from "../acquisition"
import type { WordSets } from "@/types/api"

const dataset = (version = 1): WordSets => ({
  version,
  hiraganaWords: [{ kana: "あ", romaji: "a", type: "hiragana", groups: ["h1"] }],
  katakanaWords: [], bothForms: [],
})
const response = (data: unknown = dataset()) => new Response(JSON.stringify(data))
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
function harness(mobile = true, cached?: unknown) {
  const entries = new Map<string, unknown>(cached ? [["en", cached]] : [])
  const storage: WordsetStorage = {
    read: mock(async lang => entries.get(lang)),
    write: mock(async (lang, data) => { entries.set(lang, data) }),
    remove: mock(async lang => { entries.delete(lang) }),
  }
  const fetcher = mock<WordsetFetch>(async () => response())
  const confirmation = mock((_lang: string, _value: boolean) => {})
  const service = new WordsetAcquisition({ storage, fetch: fetcher, mobile: () => mobile, confirmation })
  const states: AcquisitionState[] = []
  const events: WordsetEvent[] = []
  service.subscribe(state => states.push(state))
  service.subscribeUpdates(event => events.push(event))
  return { service, entries, storage, fetcher, confirmation, states, events }
}

describe("wordset validation and transport", () => {
  test("validates the existing payload contract without mutation, including every entry", () => {
    const data = { ...dataset(), extra: "preserved" }
    expect(validateWordset(data)).toBe(data)
    expect(() => validateWordset({ ...data, bothForms: false })).toThrow(WordsetError)
    for (const patch of [{ kana: " " }, { romaji: "" }, { type: "other" }, { groups: [1] }, { meaning: 7 }, { kanji: null }, { length: -1 }]) {
      expect(() => validateWordset({ ...data, hiraganaWords: [...data.hiraganaWords, { ...data.hiraganaWords[0], ...patch }] })).toThrow(WordsetError)
    }
    for (const version of [0, -1, 1.5, "1", NaN]) expect(() => validateWordset({ ...data, version })).toThrow(WordsetError)
  })
  test("accepts both complete production datasets", async () => {
    for (const lang of ["en", "es"]) {
      const data = await Bun.file(`public/wordset-${lang}.json`).json()
      expect(validateWordset(data)).toBe(data)
    }
  })
  test.each([
    ["http", () => new Response("error", { status: 503 })],
    ["http", () => new Response(null, { status: 304 })],
    ["parse", () => new Response("{")],
    ["validation", () => response({ error: "invalid" })],
    ["aborted", () => new Response("")],
    ["aborted", () => new Response("{}", { headers: { "content-length": "100" } })],
  ] as const)("rejects %s responses", async (kind, makeResponse) => {
    await expect(downloadWordset(async () => makeResponse(), "en")).rejects.toMatchObject({ kind })
  })
  test("classifies network and unexpected stream failures", async () => {
    await expect(downloadWordset(async () => { throw new TypeError("offline") }, "en")).rejects.toMatchObject({ kind: "network" })
    const stream = new ReadableStream({ start(controller) { controller.error(new Error("connection lost")) } })
    await expect(downloadWordset(async () => new Response(stream), "en")).rejects.toMatchObject({ kind: "aborted" })
  })
  test("reports known and unknown progress and honors conditional HEAD", async () => {
    const body = JSON.stringify(dataset())
    const progress = mock((_received: number, _total: number | null) => {})
    await downloadWordset(async () => new Response(body, { headers: { "content-length": String(new TextEncoder().encode(body).length) } }), "en", { progress })
    expect(progress.mock.calls.at(-1)).toEqual([new TextEncoder().encode(body).length, new TextEncoder().encode(body).length])
    progress.mockClear()
    await downloadWordset(async () => response(), "en", { progress })
    expect(progress.mock.calls.at(-1)?.[1]).toBeNull()
    const fetcher = mock<WordsetFetch>(async () => new Response(null, { status: 304 }))
    expect(await downloadWordset(fetcher, "en", { version: 1, head: true })).toBe("not-modified")
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ method: "HEAD", headers: { "If-None-Match": '"1"' } })
  })
})

describe("durable cache transactions", () => {
  function transaction() {
    const req = { result: dataset(), error: null, onerror: null } as unknown as IDBRequest
    const tx = { objectStore: () => ({}), error: null, oncomplete: null, onerror: null, onabort: null } as unknown as IDBTransaction
    const close = mock(() => {})
    const open = async () => ({ transaction: () => tx, close }) as unknown as IDBDatabase
    const fire = (target: IDBTransaction | IDBRequest, event: string) => {
      const handler = (target as unknown as Record<string, (event: Event) => void>)[`on${event}`]
      handler?.call(target, new Event(event))
    }
    return { req, tx, close, open, fire }
  }
  test("waits for transaction complete, then closes the connection", async () => {
    const t = transaction()
    let finished = false
    const pending = cacheTransaction("en", "readwrite", () => t.req, t.open).then(result => { finished = true; return result })
    await Promise.resolve()
    expect(finished).toBe(false)
    expect(t.close).not.toHaveBeenCalled()
    t.fire(t.tx, "complete")
    expect(await pending).toEqual(dataset())
    expect(t.close).toHaveBeenCalledTimes(1)
  })
  test.each(["request", "error", "abort", "quota"])("rejects %s even if completion follows", async kind => {
    const t = transaction()
    const pending = cacheTransaction("en", "readwrite", () => t.req, t.open)
    const outcome = pending.catch(error => error)
    await Promise.resolve()
    if (kind === "quota") Object.defineProperty(t.req, "error", { value: new DOMException("full", "QuotaExceededError") })
    t.fire(kind === "request" || kind === "quota" ? t.req : t.tx, kind === "abort" ? "abort" : "error")
    t.fire(t.tx, "complete")
    expect(await outcome).toMatchObject({ kind: "storage" })
    expect(t.close).toHaveBeenCalledTimes(1)
  })
  test("wraps open and synchronous transaction failures", async () => {
    await expect(cacheTransaction("en", "readonly", () => { throw new Error("unused") }, async () => { throw new Error("unavailable") })).rejects.toMatchObject({ kind: "storage" })
    const t = transaction()
    await expect(cacheTransaction("en", "readwrite", () => { throw new Error("put failed") }, t.open)).rejects.toMatchObject({ kind: "storage" })
    expect(t.close).toHaveBeenCalled()
  })
  test("cancellation aborts the pending IndexedDB transaction", async () => {
    const t = transaction()
    t.tx.abort = mock(() => t.fire(t.tx, "abort"))
    const controller = new AbortController()
    const outcome = cacheTransaction("en", "readwrite", () => t.req, t.open, controller.signal).catch(error => error)
    await Promise.resolve()
    controller.abort()
    expect(await outcome).toMatchObject({ kind: "storage" })
    expect(t.tx.abort).toHaveBeenCalledTimes(1)
    expect(t.close).toHaveBeenCalledTimes(1)
  })
})

describe("acquisition lifecycle", () => {
  test("explicit availability checks detect cache eviction despite a memory entry", async () => {
    const h = harness()
    await h.service.acquire("en", { consent: true })
    h.entries.clear()
    await expect(h.service.acquire("en", { verifyCache: true })).rejects.toBeInstanceOf(ConsentRequired)
    await expect(h.service.acquire("en")).rejects.toBeInstanceOf(ConsentRequired)
    expect(h.fetcher).toHaveBeenCalledTimes(1)
  })
  test("successful mobile HEAD checks announce availability without replacing data", async () => {
    const h = harness(true, dataset())
    await h.service.acquire("en")
    await h.service.revalidate("en", dataset())
    expect(h.fetcher.mock.calls[0]?.[1]?.method).toBe("HEAD")
    expect(h.events).toContainEqual({ type: "update-available", lang: "en" })
    expect(h.storage.write).not.toHaveBeenCalled()
  })
  test("manual persistence failures reject even on desktop without success events", async () => {
    const h = harness(false)
    h.storage.write = async () => { throw new Error("quota") }
    await expect(h.service.update("en")).rejects.toMatchObject({ kind: "storage" })
    expect(h.events.some(event => event.type === "updated")).toBe(false)
  })
  test("mobile cache misses require consent regardless of confirmation metadata", async () => {
    const h = harness()
    await expect(h.service.acquire("ja")).rejects.toBeInstanceOf(ConsentRequired)
    expect(h.service.state("en").status).toBe("awaiting-consent")
    expect(h.fetcher).not.toHaveBeenCalled()
    expect(h.confirmation).toHaveBeenCalledWith("en", false)
    expect(normalizeLang("JA")).toBe("en")
  })
  test("confirms only after validation, transaction completion and read-back", async () => {
    const h = harness()
    const commit = deferred<void>()
    h.storage.write = mock(async (lang, data) => { await commit.promise; h.entries.set(lang, data) })
    const persisting = deferred<void>()
    h.service.subscribe(state => { if (state.status === "persisting") persisting.resolve() })
    const pending = h.service.acquire("en", { consent: true })
    await persisting.promise
    expect(h.service.state("en").status).toBe("persisting")
    expect(h.confirmation).not.toHaveBeenCalledWith("en", true)
    commit.resolve()
    expect(await pending).toEqual(dataset())
    expect(h.storage.read).toHaveBeenCalledTimes(2)
    expect(h.confirmation).toHaveBeenCalledWith("en", true)
    expect(h.service.state("en")).toMatchObject({ status: "ready", persistence: "durable" })
  })
  test.each([true, false])("storage failure respects mobile=%s policy", async mobile => {
    const h = harness(mobile)
    h.storage.write = async () => { throw new Error("quota") }
    const pending = h.service.acquire("en", { consent: true })
    if (mobile) {
      await expect(pending).rejects.toMatchObject({ kind: "storage" })
      expect(h.service.state("en").status).toBe("failed")
      expect(h.confirmation).not.toHaveBeenCalledWith("en", true)
    } else {
      expect(await pending).toEqual(dataset())
      expect(h.service.state("en")).toMatchObject({ status: "ready", persistence: "memory", warning: { kind: "storage" } })
    }
  })
  test("read-back failure cannot confirm or enable words", async () => {
    const h = harness()
    h.storage.write = async () => {}
    await expect(h.service.acquire("en", { consent: true })).rejects.toMatchObject({ kind: "storage" })
    expect(h.confirmation).not.toHaveBeenCalledWith("en", true)
  })
  test("failed cache reads are explicit; desktop can continue with a valid download", async () => {
    for (const mobile of [true, false]) {
      const h = harness(mobile)
      h.storage.read = async () => { throw new Error("blocked") }
      const pending = h.service.acquire("en", { consent: true })
      if (mobile) await expect(pending).rejects.toMatchObject({ kind: "storage" })
      else expect(await pending).toEqual(dataset())
    }
  })
  test("corrupt cache is evicted and removal errors are observable", async () => {
    const h = harness(true, { invalid: true })
    h.storage.remove = mock(async () => { throw new Error("blocked") })
    await expect(h.service.acquire("en")).rejects.toBeInstanceOf(ConsentRequired)
    expect(h.storage.remove).toHaveBeenCalledWith("en")
    expect(h.events.map(event => "error" in event ? event.error.kind : "")).toEqual(["validation", "storage"])
    expect(h.confirmation).not.toHaveBeenCalledWith("en", true)
  })
  test("cache hit survives localStorage failure and background HTTP errors", async () => {
    const h = harness(true, dataset())
    h.confirmation.mockImplementation(() => { throw new Error("localStorage blocked") })
    h.fetcher.mockImplementation(async () => new Response(null, { status: 500 }))
    expect(await h.service.acquire("ja")).toEqual(dataset())
    await h.service.revalidate("en", dataset())
    expect(h.service.state("en").status).toBe("ready")
    expect(h.events.some(event => event.type === "revalidation-failed")).toBe(true)
    expect(h.events.some(event => event.type === "update-available")).toBe(false)
  })
  test("concurrent callers share normalized work; failures do not poison retry", async () => {
    const h = harness(false)
    h.fetcher.mockImplementationOnce(async () => { throw new Error("offline") })
    const results = await Promise.allSettled([h.service.acquire("ja"), h.service.acquire("en")])
    expect(results.map(result => result.status)).toEqual(["rejected", "rejected"])
    expect(h.fetcher).toHaveBeenCalledTimes(1)
    await Promise.all([h.service.acquire("ja"), h.service.acquire("en")])
    expect(h.fetcher).toHaveBeenCalledTimes(2)
    await h.service.acquire("es")
    expect(h.fetcher).toHaveBeenCalledTimes(3)
  })
  test("cancellation suppresses stale results and permits an immediate retry", async () => {
    const h = harness()
    const slow = deferred<Response>()
    const started = deferred<void>()
    h.fetcher.mockImplementationOnce(async () => { started.resolve(); return slow.promise })
    const controller = new AbortController()
    const pending = h.service.acquire("en", { consent: true, signal: controller.signal })
    const outcome = pending.catch(error => error)
    await started.promise
    controller.abort()
    expect(await outcome).toMatchObject({ name: "AbortError" })
    expect(h.service.state("en").status).toBe("awaiting-consent")
    await h.service.acquire("en", { consent: true })
    const count = h.states.length
    slow.resolve(response(dataset(2)))
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(h.states).toHaveLength(count)
    expect(await h.service.acquire("en")).toEqual(dataset())
    expect(h.storage.write).toHaveBeenCalledTimes(1)
  })
  test("one cancelled caller does not abort another caller's shared request", async () => {
    const h = harness()
    const slow = deferred<Response>()
    const started = deferred<void>()
    h.fetcher.mockImplementation(async () => { started.resolve(); return slow.promise })
    const controller = new AbortController()
    const first = h.service.acquire("en", { consent: true, signal: controller.signal })
    const outcome = first.catch(error => error)
    const second = h.service.acquire("ja", { consent: true })
    await started.promise
    controller.abort()
    expect(await outcome).toMatchObject({ name: "AbortError" })
    slow.resolve(response())
    expect(await second).toEqual(dataset())
    expect(h.fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(false)
  })
  test("cancelling during persistence prevents confirmation and ready", async () => {
    const h = harness()
    const commit = deferred<void>()
    const writing = deferred<void>()
    h.storage.write = async () => { writing.resolve(); await commit.promise }
    const controller = new AbortController()
    const pending = h.service.acquire("en", { consent: true, signal: controller.signal })
    const outcome = pending.catch(error => error)
    await writing.promise
    controller.abort()
    commit.resolve()
    expect(await outcome).toMatchObject({ name: "AbortError" })
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(h.service.state("en").status).toBe("awaiting-consent")
    expect(h.confirmation).not.toHaveBeenCalledWith("en", true)
  })
  test("background refresh commits before publishing, and 304 leaves data unchanged", async () => {
    const h = harness(false, dataset())
    h.fetcher.mockImplementation(async () => response(dataset(2)))
    expect(await h.service.acquire("en")).toEqual(dataset())
    await h.service.revalidate("en", dataset())
    expect(await h.service.acquire("en")).toEqual(dataset(2))
    expect(h.entries.get("en")).toEqual(dataset(2))
    expect(h.events).toContainEqual({ type: "updated", lang: "en" })
    h.fetcher.mockImplementation(async () => new Response(null, { status: 304 }))
    const count = h.events.length
    await h.service.revalidate("en", dataset(2))
    expect(h.events).toHaveLength(count)
  })
  test.each(["network", "http", "parse", "validation", "storage"])("failed background %s preserves the previous cache", async kind => {
    const h = harness(false, dataset())
    h.fetcher.mockImplementation(async () => new Response(null, { status: 304 }))
    await h.service.acquire("en")
    await h.service.revalidate("en", dataset())
    h.fetcher.mockImplementation(async () => {
      if (kind === "network") throw new Error("offline")
      if (kind === "http") return new Response(null, { status: 500 })
      if (kind === "parse") return new Response("{")
      return response(kind === "validation" ? {} : dataset(2))
    })
    if (kind === "storage") h.storage.write = async () => { throw new Error("quota") }
    await h.service.revalidate("en", dataset())
    expect(await h.service.acquire("en")).toEqual(dataset())
    expect(h.entries.get("en")).toEqual(dataset())
    expect(h.service.state("en").status).toBe("ready")
    expect(h.events.at(-1)).toMatchObject({ type: "revalidation-failed", error: { kind } })
  })
  test("manual updates reject failure and subscriptions can unsubscribe", async () => {
    const h = harness()
    const listener = mock((_event: WordsetEvent) => {})
    const unsubscribe = h.service.subscribeUpdates(listener)
    h.fetcher.mockImplementationOnce(async () => new Response(null, { status: 500 }))
    await expect(h.service.update("en")).rejects.toMatchObject({ kind: "http" })
    expect(listener).not.toHaveBeenCalled()
    expect(await h.service.update("en")).toEqual(dataset())
    expect(listener).toHaveBeenCalledWith({ type: "updated", lang: "en" })
    unsubscribe()
    await h.service.update("en")
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
