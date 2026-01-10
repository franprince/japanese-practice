import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "kanjiset-v2.json")
    const raw = await fs.readFile(filePath, "utf8")
    const data = JSON.parse(raw)
    return NextResponse.json(data)
  } catch (err) {
    console.error("Failed to load kanjiset-v2.json", err)
    return NextResponse.json({ error: "Failed to load kanji dataset" }, { status: 500 })
  }
}
