import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const resolveDatasetPath = async () => {
  const publicDir = path.join(process.cwd(), "public")

  try {
    const files = await fs.readdir(publicDir)
    const candidates = files
      .filter(f => /^kanjiset-v\d+\.json$/i.test(f))
      .sort((a, b) => {
        const va = parseInt(a.match(/v(\d+)/i)?.[1] ?? "0", 10)
        const vb = parseInt(b.match(/v(\d+)/i)?.[1] ?? "0", 10)
        return vb - va // highest version first
      })
    if (candidates.length) return path.join(publicDir, candidates[0]!)
  } catch (err) {
    console.warn("Failed to list kanjiset files", err)
  }

  return null
}

export async function GET() {
  try {
    const filePath = await resolveDatasetPath()
    if (!filePath) {
      return NextResponse.json({ error: "No kanjiset dataset found" }, { status: 404 })
    }
    const raw = await fs.readFile(filePath, "utf8")
    const data = JSON.parse(raw)

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Type": "application/json",
      },
    })
  } catch (err) {
    console.error("Failed to load kanjiset file", err)
    return NextResponse.json({ error: "Failed to load kanji dataset" }, { status: 500 })
  }
}
