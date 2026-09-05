import { openDb, STORE_WORDSETS } from "@/lib/core/db"
import type { WordSets } from "@/types/api"

import { WordsetError, type FailureKind } from "./errors"
import { fetchWordsetMetadata } from "./manifest"

export type DatasetLanguage = "en" | "es"
export { WordsetError, type FailureKind } from "./errors"
export type WordsetFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
export class ConsentRequired extends Error {
  readonly code = "MOBILE_AUTH_REQUIRED"
}
export type AcquisitionState = { lang: DatasetLanguage } & (
  | { status: "idle" | "checking-cache" | "awaiting-consent" | "persisting" }
  | { status: "downloading"; received: number; total: number | null }
  | { status: "ready"; persistence: "durable" | "memory"; warning?: WordsetError }
  | { status: "failed"; error: WordsetError }
)
export type WordsetEvent = { lang: DatasetLanguage } & (
  | { type: "update-available" | "updated" }
  | { type: "revalidation-failed" | "diagnostic"; error: WordsetError }
)
export const normalizeLang = (lang?: string): DatasetLanguage =>
  ["en", "ja"].includes(lang?.toLowerCase() ?? "") ? "en" : "es"
export const isMobileDevice = () => typeof window !== "undefined" && (
  window.matchMedia?.("(max-width: 768px)").matches ||
  /android|iphone|ipad|ipod|mobile|tablet/i.test(navigator.userAgent)
)
export const getWordsetCacheKey = (lang: string) => `prod-${normalizeLang(lang)}`
const confirmationKey = (lang: string) => `wordset-confirmed-${normalizeLang(lang)}`
export function recordConfirmation(lang: string, confirmed: boolean) {
  if (typeof localStorage === "undefined") return
  if (confirmed) localStorage.setItem(confirmationKey(lang), "1")
  else localStorage.removeItem(confirmationKey(lang))
}

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
export function validateWordset(value: unknown): WordSets {
  if (!object(value) || !Number.isSafeInteger(value.version) || Number(value.version) <= 0 ||
    (value.assetChecksum !== undefined && (typeof value.assetChecksum !== "string" || !/^[a-f0-9]{64}$/.test(value.assetChecksum)))) {
    throw new WordsetError("validation")
  }
  for (const key of ["hiraganaWords", "katakanaWords", "bothForms"]) {
    const words = value[key]
    if (key === "bothForms" && words === undefined) continue
    if (!Array.isArray(words)) throw new WordsetError("validation")
    for (const word of words) {
      if (!object(word) || typeof word.kana !== "string" || !word.kana.trim() ||
        typeof word.romaji !== "string" ||
        (!word.romaji.trim() && !(word.romaji === "" && /^[ゝゞゐゑヽヾヰヱー]$/.test(word.kana) && Array.isArray(word.groups) && word.groups.length === 0)) ||
        (word.type !== "hiragana" && word.type !== "katakana") ||
        !Array.isArray(word.groups) || !word.groups.every(group => typeof group === "string") ||
        ["meaning", "kanji"].some(field => word[field] !== undefined && typeof word[field] !== "string") ||
        (word.length !== undefined && (!Number.isSafeInteger(word.length) || Number(word.length) < 0))) {
        throw new WordsetError("validation")
      }
    }
  }
  return value as WordSets
}

export interface WordsetStorage {
  read(lang: DatasetLanguage): Promise<unknown>
  write(lang: DatasetLanguage, data: WordSets, signal?: AbortSignal): Promise<void>
  remove(lang: DatasetLanguage): Promise<void>
}

// A successful request only queues a result; durability requires transaction completion.
export async function cacheTransaction(
  lang: DatasetLanguage, mode: IDBTransactionMode,
  request: (store: IDBObjectStore, key: string) => IDBRequest,
  open: () => Promise<IDBDatabase> = openDb,
  signal?: AbortSignal,
): Promise<unknown> {
  try {
    const db = await open()
    try {
      checkAbort(signal)
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_WORDSETS, mode)
        // A synchronous request failure (for example quota exhaustion) must not
        // leave completion handlers closing over an uninitialized request.
        const req = request(tx.objectStore(STORE_WORDSETS), getWordsetCacheKey(lang))
        const abort = () => tx.abort()
        const cleanup = () => signal?.removeEventListener("abort", abort)
        tx.oncomplete = () => { cleanup(); resolve(req.result) }
        tx.onerror = () => { cleanup(); reject(new WordsetError("storage", tx.error)) }
        tx.onabort = () => { cleanup(); reject(new WordsetError("storage", tx.error)) }
        req.onerror = () => { cleanup(); reject(new WordsetError("storage", req.error)) }
        signal?.addEventListener("abort", abort, { once: true })
      })
    } finally { db.close() }
  } catch (error) {
    throw error instanceof WordsetError ? error : new WordsetError("storage", error)
  }
}
export const indexedDbStorage: WordsetStorage = {
  read: lang => cacheTransaction(lang, "readonly", (store, key) => store.get(key)),
  write: async (lang, data, signal) => { await cacheTransaction(lang, "readwrite", (store, key) => store.put(data, key), openDb, signal) },
  remove: async lang => { await cacheTransaction(lang, "readwrite", (store, key) => store.delete(key)) },
}

const checkAbort = (signal?: AbortSignal) => { signal?.throwIfAborted() }
const failure = (error: unknown, kind: FailureKind) => error instanceof WordsetError ? error : new WordsetError(kind, error)

export async function downloadWordset(
  fetcher: WordsetFetch, lang: DatasetLanguage, options: {
    signal?: AbortSignal; checksum?: string; metadataOnly?: boolean
    progress?: (received: number, total: number | null) => void
  } = {},
): Promise<WordSets | "not-modified" | "update-available"> {
  const { signal, checksum, metadataOnly, progress } = options
  const metadata = await fetchWordsetMetadata(fetcher, lang, signal)
  checkAbort(signal)
  if (checksum === metadata.checksum) return "not-modified"
  if (metadataOnly) return "update-available"
  let response: Response
  try {
    response = await fetcher(metadata.url, { cache: "default", signal })
  } catch (error) {
    checkAbort(signal)
    throw failure(error, "network")
  }
  checkAbort(signal)
  if (!response.ok) throw new WordsetError("http")
  // Manifest bytes describe the decoded asset, unlike compressed Content-Length.
  const total = metadata.bytes
  const reader = response.body?.getReader()
  if (!reader) throw new WordsetError("aborted")
  const chunks: Uint8Array[] = []
  let received = 0
  progress?.(0, total)
  try {
    while (true) {
      const { done, value } = await reader.read()
      checkAbort(signal)
      if (done) break
      chunks.push(value)
      received += value.byteLength
      progress?.(received, total)
    }
  } catch (error) {
    checkAbort(signal)
    throw failure(error, "aborted")
  } finally { reader.releaseLock() }
  if (!received || received !== total) throw new WordsetError("aborted")
  const bytes = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  let parsed: unknown
  try { parsed = JSON.parse(new TextDecoder().decode(bytes)) }
  catch (error) { throw new WordsetError("parse", error) }
  const data = validateWordset(parsed)
  if (data.version !== metadata.version) throw new WordsetError("validation")
  let digest: ArrayBuffer
  try { digest = await crypto.subtle.digest("SHA-256", bytes) }
  catch (error) { throw new WordsetError("validation", error) }
  checkAbort(signal)
  const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("")
  if (actual !== metadata.checksum) throw new WordsetError("validation")
  return { ...data, assetChecksum: metadata.checksum }
}

type Options = { consent?: boolean; signal?: AbortSignal; verifyCache?: boolean }
type Operation = { controller: AbortController; promise: Promise<WordSets>; users: number }
export class WordsetAcquisition {
  private states = new Map<DatasetLanguage, AcquisitionState>()
  private readonly idleStates: Record<DatasetLanguage, AcquisitionState> = {
    en: { lang: "en", status: "idle" },
    es: { lang: "es", status: "idle" },
  }
  private memory = new Map<DatasetLanguage, WordSets>()
  private operations = new Map<DatasetLanguage, Operation>()
  private refreshing = new Map<DatasetLanguage, Promise<void>>()
  private stateListeners = new Set<(state: AcquisitionState) => void>()
  private eventListeners = new Set<(event: WordsetEvent) => void>()
  constructor(private deps: {
    storage: WordsetStorage; fetch: WordsetFetch; mobile: () => boolean
    confirmation: (lang: string, confirmed: boolean) => void
  }) {}
  state(lang: string): AcquisitionState {
    const normalized = normalizeLang(lang)
    return this.states.get(normalized) ?? this.idleStates[normalized]
  }
  subscribe(listener: (state: AcquisitionState) => void) {
    this.stateListeners.add(listener)
    return () => { this.stateListeners.delete(listener) }
  }
  subscribeUpdates(listener: (event: WordsetEvent) => void) {
    this.eventListeners.add(listener)
    return () => { this.eventListeners.delete(listener) }
  }
  private notify<T>(listeners: Set<(value: T) => void>, value: T) {
    for (const listener of listeners) {
      try { listener(value) }
      catch (error) { console.warn("Wordset subscriber failed", error) }
    }
  }
  private publish(state: AcquisitionState) {
    this.states.set(state.lang, state)
    this.notify(this.stateListeners, state)
  }
  private emit(event: WordsetEvent) { this.notify(this.eventListeners, event) }
  private confirm(lang: DatasetLanguage, confirmed: boolean) {
    try { this.deps.confirmation(lang, confirmed) }
    catch (error) { this.emit({ type: "diagnostic", lang, error: failure(error, "storage") }) }
  }
  async readCache(language: string): Promise<WordSets | null> {
    const lang = normalizeLang(language)
    let raw: unknown
    try { raw = await this.deps.storage.read(lang) }
    catch (error) { throw failure(error, "storage") }
    if (raw === null || raw === undefined) {
      this.memory.delete(lang)
      this.confirm(lang, false)
      return null
    }
    try { return validateWordset(raw) }
    catch (error) {
      this.memory.delete(lang)
      this.emit({ type: "diagnostic", lang, error: failure(error, "validation") })
      this.confirm(lang, false)
      try { await this.deps.storage.remove(lang) }
      catch (cause) { this.emit({ type: "diagnostic", lang, error: failure(cause, "storage") }) }
      return null
    }
  }
  async prime(language: string, raw: unknown, signal?: AbortSignal): Promise<WordSets> {
    const lang = normalizeLang(language)
    const data = validateWordset(raw)
    checkAbort(signal)
    try { await this.deps.storage.write(lang, data, signal) }
    catch (error) { throw failure(error, "storage") }
    checkAbort(signal)
    if (this.deps.mobile()) {
      const saved = await this.readCache(lang)
      checkAbort(signal)
      if (!saved || saved.version !== data.version || saved.assetChecksum !== data.assetChecksum) throw new WordsetError("storage")
      this.confirm(lang, true)
    }
    this.memory.set(lang, data)
    return data
  }
  acquire(language: string, options: Options = {}): Promise<WordSets> {
    const lang = normalizeLang(language)
    if (options.signal?.aborted) return Promise.reject(options.signal.reason)
    const available = this.memory.get(lang)
    const state = this.state(lang)
    const memoryOnlyOnMobile = this.deps.mobile() && state.status === "ready" && state.persistence === "memory"
    if (available && !options.verifyCache && !memoryOnlyOnMobile) return Promise.resolve(available)
    let operation = this.operations.get(lang)
    if (!operation || operation.controller.signal.aborted) {
      const controller = new AbortController()
      operation = { controller, users: 0, promise: Promise.resolve(null as unknown as WordSets) }
      const current = operation
      operation.promise = Promise.resolve().then(() => this.run(lang, !!options.consent, controller.signal)).finally(() => {
        if (this.operations.get(lang) === current) this.operations.delete(lang)
      })
      this.operations.set(lang, operation)
    }
    const shared = operation
    shared.users++
    return new Promise((resolve, reject) => {
      let settled = false
      const finish = (error?: unknown, data?: WordSets) => {
        if (settled) return
        settled = true
        options.signal?.removeEventListener("abort", abort)
        shared.users--
        if (error !== undefined) reject(error)
        else resolve(data!)
      }
      const abort = () => {
        finish(options.signal!.reason)
        if (!shared.users) {
          shared.controller.abort()
          this.publish({ lang, status: "awaiting-consent" })
        }
      }
      options.signal?.addEventListener("abort", abort, { once: true })
      shared.promise.then(data => finish(undefined, data), error => finish(error))
    })
  }
  private async run(lang: DatasetLanguage, consent: boolean, signal: AbortSignal): Promise<WordSets> {
    const publish = (state: AcquisitionState) => { checkAbort(signal); this.publish(state) }
    try {
      publish({ lang, status: "checking-cache" })
      let cached: WordSets | null = null
      try { cached = await this.readCache(lang) }
      catch (error) {
        if (this.deps.mobile()) throw error
        this.emit({ type: "diagnostic", lang, error: failure(error, "storage") })
      }
      checkAbort(signal)
      if (cached) {
        this.memory.set(lang, cached)
        this.confirm(lang, true)
        publish({ lang, status: "ready", persistence: "durable" })
        void this.revalidate(lang, cached)
        return cached
      }
      if (this.deps.mobile() && !consent) {
        publish({ lang, status: "awaiting-consent" })
        throw new ConsentRequired("Wordset fetch blocked until user confirms")
      }
      publish({ lang, status: "downloading", received: 0, total: null })
      const data = await downloadWordset(this.deps.fetch, lang, {
        signal, progress: (received, total) => publish({ lang, status: "downloading", received, total }),
      })
      if (typeof data === "string") throw new WordsetError("http")
      publish({ lang, status: "persisting" })
      try { await this.prime(lang, data, signal) }
      catch (error) {
        checkAbort(signal)
        if (this.deps.mobile()) throw error
        const warning = failure(error, "storage")
        this.memory.set(lang, data)
        publish({ lang, status: "ready", persistence: "memory", warning })
        this.emit({ type: "diagnostic", lang, error: warning })
        return data
      }
      publish({ lang, status: "ready", persistence: "durable" })
      return data
    } catch (error) {
      checkAbort(signal)
      if (error instanceof ConsentRequired) throw error
      const typed = failure(error, "network")
      publish({ lang, status: "failed", error: typed })
      throw typed
    }
  }
  revalidate(language: string, cached: WordSets): Promise<void> {
    const lang = normalizeLang(language)
    const existing = this.refreshing.get(lang)
    if (existing) return existing
    const pending = (async () => {
      try {
        const result = await downloadWordset(this.deps.fetch, lang, { checksum: cached.assetChecksum, metadataOnly: this.deps.mobile() })
        if (result === "not-modified") return
        if (result === "update-available") { this.emit({ type: result, lang }); return }
        await this.prime(lang, result)
        this.emit({ type: "updated", lang })
      } catch (error) {
        this.emit({ type: "revalidation-failed", lang, error: failure(error, "network") })
      }
    })().finally(() => this.refreshing.delete(lang))
    this.refreshing.set(lang, pending)
    return pending
  }
  async update(language: string): Promise<WordSets> {
    const lang = normalizeLang(language)
    await this.refreshing.get(lang)
    const data = await downloadWordset(this.deps.fetch, lang)
    if (typeof data === "string") throw new WordsetError("http")
    await this.prime(lang, data)
    this.publish({ lang, status: "ready", persistence: "durable" })
    this.emit({ type: "updated", lang })
    return data
  }
}

export const wordsetAcquisition = new WordsetAcquisition({
  storage: indexedDbStorage, fetch: (...args) => fetch(...args),
  mobile: isMobileDevice, confirmation: recordConfirmation,
})
