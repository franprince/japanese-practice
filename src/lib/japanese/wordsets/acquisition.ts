/** Own acquisition state, shared requests, memory and background refreshes. */
import type { AcquisitionState, DatasetLanguage, WordsetEvent, WordsetFetch, WordsetStorage, WordSets } from "./contracts"
import { ConsentRequired, wordsetFailure as failure, WordsetError } from "./errors"
import { normalizeLang, isMobileDevice, recordConfirmation } from "./policy"
import { indexedDbStorage } from "./storage"
import { downloadWordset } from "./transport"
import { validateWordset } from "./validation"

const checkAbort = (signal?: AbortSignal) => { signal?.throwIfAborted() }

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
