import fs from "fs"
import path from "path"
import readline from "readline"

type CliArgs = {
  input?: string
  prop?: string
}

type KanjiEntry = Record<string, any>

const readVersions = (dir: string): string[] => {
  const files = fs.readdirSync(dir)
  return files
    .filter((f) => /^kanjiset-v\d+\.json$/i.test(f))
    .sort((a, b) => {
      const va = parseInt(a.match(/v(\d+)/i)?.[1] ?? "0", 10)
      const vb = parseInt(b.match(/v(\d+)/i)?.[1] ?? "0", 10)
      return va - vb
    })
}

const promptSelect = async (message: string, options: string[], defaultIndex: number): Promise<string> => {
  if (options.length === 0) return ""
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = (q: string) => new Promise<string>((res) => rl.question(q, res))
  const safeDefault = Math.max(0, Math.min(defaultIndex, options.length - 1))
  const list = options.map((o, i) => `${i + 1}) ${o}${i === safeDefault ? " (default)" : ""}`).join("\n")
  const answer = await ask(`${message}\n${list}\nChoose [${safeDefault + 1}]: `)
  rl.close()
  const idx = parseInt(answer.trim(), 10)
  if (!Number.isNaN(idx) && idx >= 1 && idx <= options.length) {
    const selected = options[idx - 1]
    if (selected !== undefined) return selected
  }
  const fallback: string = options[safeDefault] ?? options[0] ?? ""
  return fallback
}

const promptYesNo = async (message: string, defaultYes = false): Promise<boolean> => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = (q: string) => new Promise<string>((res) => rl.question(q, res))
  const suffix = defaultYes ? " [Y/n] " : " [y/N] "
  const answer = (await ask(`${message}${suffix}`)).trim().toLowerCase()
  rl.close()
  if (!answer) return defaultYes
  if (["y", "yes", "s", "si", "sí"].includes(answer)) return true
  if (["n", "no"].includes(answer)) return false
  return defaultYes
}

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2)
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag)
    const val = idx >= 0 ? args[idx + 1] : undefined
    return typeof val === "string" ? val : undefined
  }
  return {
    input: get("--input"),
    prop: get("--prop"),
  }
}

const isMissing = (value: unknown): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  return false
}

const main = async () => {
  const args = parseArgs()
  const dataDir = path.join(process.cwd(), "public")

  const versions = readVersions(dataDir)
  const defaultIdx = versions.length > 0 ? versions.length - 1 : 0
  const chosenDataset =
    args.input ??
    (versions.length > 0
      ? await promptSelect("Select kanjiset dataset to scan:", versions, defaultIdx)
      : "kanjiset.json")
  const datasetPath = path.resolve(dataDir, chosenDataset)

  const raw = fs.readFileSync(datasetPath, "utf8")
  const entries: KanjiEntry[] = JSON.parse(raw)
  if (!Array.isArray(entries) || entries.length === 0) {
    console.error("Dataset is empty or invalid")
    process.exit(1)
  }

  const sampleKeys = Object.keys(entries[0] ?? {})
  const propOptions = Array.from(new Set(sampleKeys)).sort()
  const defaultPropIdx = args.prop ? propOptions.indexOf(args.prop) : propOptions.indexOf("meaning_es")
  const chosenProp =
    args.prop && propOptions.includes(args.prop)
      ? args.prop
      : await promptSelect("Select property to check for missing values:", propOptions, defaultPropIdx >= 0 ? defaultPropIdx : 0)

  const missing = entries.filter((entry) => isMissing(entry?.[chosenProp]))

  console.log(`Dataset: ${chosenDataset}`)
  console.log(`Property: ${chosenProp}`)
  console.log(`Total entries: ${entries.length}`)
  console.log(`Missing ${chosenProp}: ${missing.length} (${((missing.length / Math.max(entries.length, 1)) * 100).toFixed(2)}%)`)

  const preview = missing.slice(0, 10)
  if (preview.length) {
    console.log("\nFirst missing examples (up to 10):")
    preview.forEach((e) => {
      const char = e.char ?? "—"
      const meaningEn = e.meaning_en ?? e.meaning ?? "—"
      console.log(`char: ${char} | meaning_en: ${meaningEn} | ${chosenProp}: ${e?.[chosenProp] ?? "—"}`)
    })
  } else {
    console.log("No missing entries found for this property.")
    return
  }

  const wantRemove = await promptYesNo("Remove missing entries and write a new dataset?", false)
  if (!wantRemove) return

  const kept = entries.filter((entry) => !isMissing(entry?.[chosenProp]))
  const { dir, name, ext } = path.parse(datasetPath)
  const outputName = `${name}-no-missing-${chosenProp}${ext || ".json"}`
  const outputPath = path.join(dir, outputName)
  fs.writeFileSync(outputPath, JSON.stringify(kept, null, 2))

  console.log(`\nWrote dataset without missing ${chosenProp}: ${outputPath}`)
  console.log(`Entries kept: ${kept.length} (removed ${entries.length - kept.length})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
