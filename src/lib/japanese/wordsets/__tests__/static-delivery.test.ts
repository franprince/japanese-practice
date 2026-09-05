import { describe, expect, test, mock } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { createHash } from "node:crypto"
import { publishWordsets } from "../../../../../scripts/publish-wordsets"
import { fixtureChecksum, fixtureManifest } from "@/test/wordset-fixture"
import { WordsetAcquisition } from "../acquisition"
import type { WordsetFetch } from "../contracts"
import { downloadWordset, fetchWordsetMetadata } from "../transport"
import { validateManifest } from "../manifest"

const data = { version: 1, hiraganaWords: [], katakanaWords: [] }
const json = (value: unknown) => new Response(JSON.stringify(value))

describe("static wordset contract", () => {
  test("rejects malformed manifests and unsafe or mismatched asset paths", () => {
    const valid = fixtureManifest(data)
    expect(validateManifest(valid)).toBe(valid)
    for (const value of [null, [], {}, { ...valid, schemaVersion: 2 }, { ...valid, datasets: { en: valid.datasets.en } }]) {
      expect(() => validateManifest(value)).toThrow()
    }
    for (const patch of [
      { language: "ja" }, { version: 0 }, { version: 1.5 }, { bytes: -1 }, { bytes: "12" },
      { checksum: "bad" }, { url: "https://evil.example/asset.json" },
      { url: "/wordsets/../asset.json" }, { url: `/wordsets/es-${valid.datasets.en.checksum}.json` },
    ]) {
      expect(() => validateManifest({ ...valid, datasets: { ...valid.datasets, en: { ...valid.datasets.en, ...patch } } })).toThrow()
    }
  })
  test.each([
    ["http", () => new Response(null, { status: 404 })],
    ["http", () => new Response(null, { status: 304 })],
    ["parse", () => new Response("{")],
    ["validation", () => json({ error: "bad" })],
  ] as const)("classifies manifest %s failures", async (kind, response) => {
    await expect(fetchWordsetMetadata(async () => response(), "en")).rejects.toMatchObject({ kind })
  })
  test("manifest transport failure and explicit cancellation remain distinguishable", async () => {
    await expect(fetchWordsetMetadata(async () => { throw new Error("offline") }, "en")).rejects.toMatchObject({ kind: "network" })
    const controller = new AbortController()
    controller.abort()
    const fetcher = mock<WordsetFetch>(async () => json(fixtureManifest(data)))
    await expect(fetchWordsetMetadata(fetcher, "en", controller.signal)).rejects.toMatchObject({ name: "AbortError" })
    expect(fetcher).not.toHaveBeenCalled()
  })
  test.each(["hash", "version", "parse", "shape", "missing"])("rejects %s asset failures before persistence", async kind => {
    const manifest = fixtureManifest(data)
    let body = JSON.stringify(data)
    if (kind === "hash") { body = JSON.stringify(data) + " "; manifest.datasets.en.bytes++ }
    if (kind === "version") manifest.datasets.en.version = 2
    if (kind === "parse") { body = "{"; manifest.datasets.en.bytes = 1 }
    if (kind === "shape") { body = "{}"; manifest.datasets.en.bytes = 2 }
    const write = mock(async () => {})
    const service = new WordsetAcquisition({
      storage: { read: async () => null, write, remove: async () => {} },
      mobile: () => true, confirmation: () => {},
      fetch: async input => String(input).endsWith("manifest.json") ? json(manifest)
        : kind === "missing" ? new Response(null, { status: 404 }) : new Response(body),
    })
    await expect(service.acquire("en", { consent: true })).rejects.toMatchObject({ kind: kind === "parse" ? "parse" : kind === "missing" ? "http" : "validation" })
    expect(write).not.toHaveBeenCalled()
  })
  test("unchanged desktop cache uses metadata only; changed bytes at the same version download a new URL", async () => {
    const cached = { ...data, assetChecksum: fixtureChecksum(data) }
    let entry = cached
    let next = data
    const requests: string[] = []
    const service = new WordsetAcquisition({
      storage: { read: async () => entry, write: async (_lang, value) => { entry = value as typeof cached }, remove: async () => {} },
      mobile: () => false, confirmation: () => {},
      fetch: async (input, options) => {
        requests.push(String(input))
        if (String(input).endsWith("manifest.json")) return json(fixtureManifest(next))
        expect(options?.cache).toBe("default")
        return json(next)
      },
    })
    expect(await service.acquire("ja")).toEqual(cached)
    await service.revalidate("en", cached)
    expect(requests.every(url => url.endsWith("manifest.json"))).toBe(true)
    next = { ...data, katakanaWords: [], extra: "changed without version bump" } as typeof data
    await service.revalidate("en", cached)
    expect(requests.at(-1)).toBe(fixtureManifest(next).datasets.en.url)
    expect(entry.assetChecksum).toBe(fixtureChecksum(next))
    expect(entry.version).toBe(1)
  })
  test("downloads both languages from their own manifest entries", async () => {
    for (const language of ["en", "es"] as const) {
      const manifest = fixtureManifest(data)
      const requested: string[] = []
      const result = await downloadWordset(async input => {
        requested.push(String(input))
        return String(input).endsWith("manifest.json") ? json(manifest) : json(data)
      }, language)
      expect(requested).toEqual(["/wordsets/manifest.json", manifest.datasets[language].url])
      expect(result).toEqual({ ...data, assetChecksum: fixtureChecksum(data) })
    }
  })
})

describe("static artifact generation", () => {
  test("publishes exact deterministic bytes, changes URLs with content and retains prior assets", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "wordset-publish-"))
    try {
      for (const language of ["en", "es"]) await writeFile(path.join(directory, `wordset-${language}.json`), JSON.stringify(data))
      const first = await publishWordsets(directory)
      expect(await publishWordsets(directory)).toEqual(first)
      for (const entry of Object.values(first.datasets)) {
        const bytes = await readFile(path.join(directory, entry.url.replace(/^\//, "")))
        expect(bytes.length).toBe(entry.bytes)
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(entry.checksum)
      }
      await writeFile(path.join(directory, "wordset-en.json"), JSON.stringify({ ...data, extra: "change" }))
      const next = await publishWordsets(directory)
      expect(next.datasets.en.url).not.toBe(first.datasets.en.url)
      expect(next.datasets.es).toEqual(first.datasets.es)
      expect(next.datasets.en.version).toBe(first.datasets.en.version)
      expect(await readFile(path.join(directory, first.datasets.en.url.slice(1)), "utf8")).toBe(JSON.stringify(data))
      const saved = await readFile(path.join(directory, "wordsets/manifest.json"), "utf8")
      await writeFile(path.join(directory, "wordset-es.json"), "{}")
      await expect(publishWordsets(directory)).rejects.toThrow()
      expect(await readFile(path.join(directory, "wordsets/manifest.json"), "utf8")).toBe(saved)
    } finally { await rm(directory, { recursive: true, force: true }) }
  })
})
