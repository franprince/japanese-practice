/** Dataset types shared by transport, storage and lifecycle consumers. */
import type { WordSets } from "@/types/api"
import type { WordsetError } from "./errors"

export type { WordSets, LoaderDeps } from "@/types/api"
export type DatasetLanguage = "en" | "es"
export type WordsetFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
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
export interface WordsetStorage {
  read(lang: DatasetLanguage): Promise<unknown>
  write(lang: DatasetLanguage, data: WordSets, signal?: AbortSignal): Promise<void>
  remove(lang: DatasetLanguage): Promise<void>
}

export type WordsetMetadata = {
  language: DatasetLanguage
  version: number
  bytes: number
  checksum: string
  url: string
}
export type WordsetManifest = {
  schemaVersion: 1
  datasets: Record<DatasetLanguage, WordsetMetadata>
}
