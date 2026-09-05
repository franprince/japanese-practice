import { createHash } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { validateWordset, validateManifest, type WordsetManifest, type WordsetMetadata } from "../src/lib/japanese/wordsets/build"

/** Publish exact source bytes. Never remove older immutable assets in place. */
export async function publishWordsets(publicDir: string): Promise<WordsetManifest> {
  const output = path.join(publicDir, "wordsets")
  const datasets = {} as WordsetManifest["datasets"]
  // Validate both sources before publishing anything.
  const assets = await Promise.all((["en", "es"] as const).map(async language => {
    const bytes = await readFile(path.join(publicDir, `wordset-${language}.json`))
    const data = validateWordset(JSON.parse(bytes.toString("utf8")))
    const checksum = createHash("sha256").update(bytes).digest("hex")
    const metadata: WordsetMetadata = {
      language, version: data.version, bytes: bytes.length, checksum,
      url: `/wordsets/${language}-${checksum}.json`,
    }
    return { bytes, metadata }
  }))
  await mkdir(output, { recursive: true })
  for (const { bytes, metadata } of assets) {
    await writeFile(path.join(output, path.basename(metadata.url)), bytes)
    datasets[metadata.language] = metadata
  }
  const manifest = validateManifest({ schemaVersion: 1, datasets })
  const temporary = path.join(output, "manifest.json.tmp")
  await writeFile(temporary, JSON.stringify(manifest) + "\n")
  await rename(temporary, path.join(output, "manifest.json"))
  return manifest
}

if (import.meta.main) {
  await publishWordsets(path.join(process.cwd(), "public"))
  console.log("Published static wordsets and manifest")
}
