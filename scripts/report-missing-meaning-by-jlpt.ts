import fs from "fs"
import path from "path"
import readline from "readline"

type KanjiEntry = {
  char: string
  jlpt: string | null
  meaning_en: string | null
  meaning_es: string | null
  reading?: string | null
  rank?: string
  id?: number
}

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
    const choice = options[idx - 1]
    if (choice) return choice
  }
  const fallback: string = options[safeDefault] ?? options[0] ?? ""
  return fallback
}

const ensureUniquePath = (target: string): string => {
  if (!fs.existsSync(target)) return target
  const { dir, name, ext } = path.parse(target)
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const candidate = path.join(dir, `${name}-copy-${stamp}${ext}`)
  return candidate
}

type CliArgs = {
  input?: string
  output?: string
  jlpt?: string
}

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2)
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag)
    const val = idx >= 0 ? args[idx + 1] : undefined
    return typeof val === "string" ? val : undefined
  }
  const jlpt = get("--jlpt")?.toLowerCase()
  return {
    jlpt,
    input: get("--input"),
    output: get("--output"),
  }
}

const main = async () => {
  const { jlpt, input: inputArg, output: outputArg } = parseArgs()
  const jlptLevels = ["jlpt-n5", "jlpt-n4", "jlpt-n3", "jlpt-n2", "jlpt-n1"]
  const defaultJlptIdx = jlptLevels.indexOf("jlpt-n1")
  const jlptChoice =
    jlpt && jlptLevels.includes(jlpt)
      ? jlpt
      : await promptSelect("Select JLPT level to scan:", jlptLevels, defaultJlptIdx >= 0 ? defaultJlptIdx : jlptLevels.length - 1)

  // Interactive dataset selection
  const dataDir = path.join(process.cwd(), "data")
  const versions = readVersions(dataDir)
  const defaultIdx = versions.length > 0 ? versions.length - 1 : 0
  const chosenFile =
    inputArg ??
    (versions.length > 0
      ? await promptSelect("Select kanjiset dataset to scan:", versions, defaultIdx)
      : "kanjiset.json")
  const input = path.resolve(dataDir, chosenFile)

  // Output path with no overwrite
  const defaultOutput = path.join(process.cwd(), "data", "kanjiset-missing-es.json")
  const output = ensureUniquePath(outputArg ? path.resolve(outputArg) : defaultOutput)

  const raw = fs.readFileSync(input, "utf8")
  const entries: KanjiEntry[] = JSON.parse(raw)

  const suspects = entries.filter((k) => {
    if (k.jlpt?.toLowerCase() !== jlptChoice) return false
    const en = (k.meaning_en || "").trim()
    const es = (k.meaning_es || "").trim()
    if (!en) return false
    return !es || es.toLowerCase() === en.toLowerCase()
  })

  console.log(`JLPT (${jlptChoice}) entries needing Spanish review: ${suspects.length}`)
  suspects.forEach((k) => {
    console.log(
      `${k.char} | en: ${k.meaning_en ?? "—"} | es: ${k.meaning_es ?? "—"} | reading: ${k.reading ?? "—"} | rank: ${
        k.rank ?? "—"
      } | id: ${k.id ?? "—"}`,
    )
  })

  fs.writeFileSync(output, JSON.stringify(suspects, null, 2))
  console.log(`\nWritten JSON report to ${output}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
