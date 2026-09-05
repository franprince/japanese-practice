import { WordsetError } from "./errors"
import type { DatasetLanguage, WordsetFetch } from "./acquisition"

export const WORDSET_MANIFEST_URL = "/wordsets/manifest.json"
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
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export function validateManifest(value: unknown): WordsetManifest {
  if (!object(value) || value.schemaVersion !== 1 || !object(value.datasets)) throw new WordsetError("validation")
  for (const lang of ["en", "es"] as const) {
    const entry = value.datasets[lang]
    if (!object(entry) || entry.language !== lang ||
      !Number.isSafeInteger(entry.version) || Number(entry.version) <= 0 ||
      !Number.isSafeInteger(entry.bytes) || Number(entry.bytes) <= 0 ||
      typeof entry.checksum !== "string" || !/^[a-f0-9]{64}$/.test(entry.checksum) ||
      entry.url !== `/wordsets/${lang}-${entry.checksum}.json`) throw new WordsetError("validation")
  }
  return value as WordsetManifest
}

export async function fetchWordsetMetadata(
  fetcher: WordsetFetch, lang: DatasetLanguage, signal?: AbortSignal,
): Promise<WordsetMetadata> {
  signal?.throwIfAborted()
  let response: Response
  try {
    // Let the browser revalidate its cached representation and resolve HTTP 304.
    response = await fetcher(WORDSET_MANIFEST_URL, { cache: "no-cache", signal })
  } catch (error) {
    signal?.throwIfAborted()
    throw new WordsetError("network", error)
  }
  signal?.throwIfAborted()
  if (!response.ok) throw new WordsetError("http")
  let body: string
  try { body = await response.text() }
  catch (error) { signal?.throwIfAborted(); throw new WordsetError("aborted", error) }
  signal?.throwIfAborted()
  let value: unknown
  try { value = JSON.parse(body) }
  catch (error) { throw new WordsetError("parse", error) }
  return validateManifest(value).datasets[lang]
}
