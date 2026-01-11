import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const resolveDatasetPath = async () => {
  const dataDir = path.join(process.cwd(), "data")
  const explicit = process.env.KANJISET_VERSION
  if (explicit) return path.join(dataDir, `kanjiset-${explicit}.json`)

  try {
    const files = await fs.readdir(dataDir)
    const candidates = files.filter(f => /^kanjiset-.*\.json$/.test(f)).sort().reverse()
    if (candidates.length) return path.join(dataDir, candidates[0]!)
  } catch (err) {
    console.warn("Failed to list kanjiset files, falling back to default", err)
  }

  return path.join(dataDir, "kanjiset-v2.json")
}

export async function GET() {
  try {
    const filePath = await resolveDatasetPath()
    const raw = await fs.readFile(filePath, "utf8")
    const data = JSON.parse(raw)
    return NextResponse.json(data)
  } catch (err) {
    console.error("Failed to load kanjiset file", err)
    return NextResponse.json({ error: "Failed to load kanji dataset" }, { status: 500 })
  }
}
