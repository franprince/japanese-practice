/** Fetch/revalidate metadata and verify streamed immutable payloads. */
import type { DatasetLanguage, WordsetFetch, WordsetMetadata, WordSets } from "./contracts"
import { WordsetError, wordsetFailure as failure } from "./errors"
import { WORDSET_MANIFEST_URL, validateManifest } from "./manifest"
import { validateWordset } from "./validation"

const checkAbort = (signal?: AbortSignal) => { signal?.throwIfAborted() }

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
