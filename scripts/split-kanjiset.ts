import fs from "fs"
import path from "path"

const PUBLIC_DIR = path.join(process.cwd(), "public")
const INPUT_FILE = path.join(PUBLIC_DIR, "kanjiset-v1.json")

const LEVELS = ["n5", "n4", "n3", "n2", "n1"]

async function splitKanjiSet() {
    console.log("Reading kanjiset-v1.json...")
    const rawData = fs.readFileSync(INPUT_FILE, "utf-8")
    const kanjiList = JSON.parse(rawData)

    console.log(`Total entries: ${kanjiList.length}`)

    // Initialize buckets
    const buckets: Record<string, any[]> = {}
    LEVELS.forEach(level => {
        buckets[level] = []
    })

    // Distribute entries
    kanjiList.forEach((entry: any) => {
        if (!entry.jlpt) return

        // JLPT format is "jlpt-n5", etc.
        const levelMatch = entry.jlpt.toLowerCase().match(/n[1-5]/)
        if (levelMatch) {
            const level = levelMatch[0] // "n5"
            if (buckets[level]) {
                buckets[level].push(entry)
            }
        }
    })

    // Write files
    LEVELS.forEach(level => {
        const entries = buckets[level]
        if (!entries) return

        const filename = `kanji-${level}.json`
        const filePath = path.join(PUBLIC_DIR, filename)

        fs.writeFileSync(filePath, JSON.stringify(entries, null, 2))
        console.log(`Created ${filename} with ${entries.length} entries`)
    })

    console.log("Splitting complete!")
}

splitKanjiSet().catch(console.error)
