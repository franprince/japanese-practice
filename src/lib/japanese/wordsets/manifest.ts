/** Pure manifest schema and immutable asset-path contract. */
import { WordsetError } from "./errors"
import type { WordsetManifest } from "./contracts"

export const WORDSET_MANIFEST_URL = "/wordsets/manifest.json"
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
