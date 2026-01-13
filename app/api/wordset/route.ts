import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const resolveWordsetPath = async (lang: string) => {
  const publicDir = path.join(process.cwd(), "public")
  try {
    const files = await fs.readdir(publicDir)
    const candidates = files
      .map(file => {
        const match = file.match(new RegExp(`^wordset-${lang}-v(\\d+)\\.json$`, "i"))
        if (!match) return null
        return { file, version: parseInt(match[1] ?? "0", 10) }
      })
      .filter((entry): entry is { file: string; version: number } => !!entry)
      .sort((a, b) => b.version - a.version)

    if (candidates.length > 0) {
      return path.join(publicDir, candidates[0]!.file)
    }
  } catch (err) {
    console.warn("Failed to list wordset files, falling back", err)
  }

  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lang = (searchParams.get("lang") || "es").toLowerCase()

  const filePath = await resolveWordsetPath(lang)
  if (!filePath) {
    return NextResponse.json({ error: "Wordset not found" }, { status: 404 })
  }

  try {
    const raw = await fs.readFile(filePath, "utf8")
    const data = JSON.parse(raw)

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Type": "application/json",
      },
    })
  } catch (err) {
    console.error("Failed to read wordset file", err)
    return NextResponse.json({ error: "Failed to read wordset" }, { status: 500 })
  }
}
