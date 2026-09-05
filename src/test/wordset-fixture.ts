import { createHash } from "node:crypto"
import type { WordsetManifest } from "@/lib/japanese/words/manifest"

export const fixtureChecksum = (data: unknown) => createHash("sha256").update(JSON.stringify(data)).digest("hex")
export function fixtureManifest(data: { version: number }): WordsetManifest {
  const checksum = fixtureChecksum(data)
  const bytes = Buffer.byteLength(JSON.stringify(data))
  const entry = (language: "en" | "es") => ({ language, version: data.version, bytes, checksum, url: `/wordsets/${language}-${checksum}.json` })
  return { schemaVersion: 1, datasets: { en: entry("en"), es: entry("es") } }
}
