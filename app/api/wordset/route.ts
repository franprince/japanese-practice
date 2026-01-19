import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const resolveWordsetPath = async (lang: string) => {
  const publicDir = path.join(process.cwd(), "public")
  const candidate = path.join(publicDir, `wordset-${lang}.json`)
  try {
    await fs.access(candidate)
    return candidate
  } catch (err) {
    console.warn("Wordset file not found:", candidate, err)
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lang = (searchParams.get("lang") || "es").toLowerCase()

  const filePath = await resolveWordsetPath(lang)
  if (!filePath) {
    return NextResponse.json({ error: "Wordset not found" }, { status: 404 })
  }

  // Extract version from file contents for ETag
  let version = "0"
  let raw: string | null = null
  try {
    raw = await fs.readFile(filePath, "utf8")
    const parsed = JSON.parse(raw)
    if (typeof parsed?.version === "number") {
      version = String(parsed.version)
    }
  } catch (err) {
    console.error("Failed to read wordset file", err)
    return NextResponse.json({ error: "Failed to read wordset" }, { status: 500 })
  }
  const etag = `"${version}"`

  // Check ETag
  const ifNoneMatch = request.headers.get("if-none-match")
  // console.log(`[API] Wordset ETag Check - Current: ${etag}, Client: ${ifNoneMatch}`)

  // Robust ETag comparison:
  // 1. Remove "W/" prefix if present
  // 2. Remove surrounding quotes if present
  // 3. Compare trimmed values
  if (ifNoneMatch) {
    const cleanClient = ifNoneMatch.replace(/^W\//, "").replace(/"/g, "").trim()
    const cleanServer = etag.replace(/^W\//, "").replace(/"/g, "").trim()

    if (cleanClient === cleanServer) {
      // console.log("[API] Returning 304 Not Modified")
      return new NextResponse(null, { status: 304 })
    }
  }

  const data = JSON.parse(raw!)

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-cache", // Forces validation with ETag every time
      "ETag": etag,
      "Content-Type": "application/json",
    },
  })
}
