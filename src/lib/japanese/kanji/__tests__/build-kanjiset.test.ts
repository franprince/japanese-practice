import { expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

test("kanji rebuild preserves previous Spanish meanings behind source dictionary meanings", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "kanji-rebuild-"))
    const previous = [
        { char: "聞", meaning_en: "to hear", meaning_es: "escuchar", reading: "きく", jlpt: "jlpt-n5" },
        { char: "日", meaning_en: "day", meaning_es: "traducción anterior", reading: "にち", jlpt: "jlpt-n3" },
        { char: "売", meaning_en: "to sell", meaning_es: "", reading: "うる", jlpt: "jlpt-n5" },
        { char: "木", meaning_en: "wood", meaning_es: null, reading: "き", jlpt: "jlpt-n5" },
    ]
    const source = {
        words: [
            { kanji: [{ text: "日" }], sense: [{ gloss: [{ text: "día" }] }] },
            { kanji: [{ text: "売" }], sense: [{ gloss: [{ text: "vender" }] }] },
        ],
    }
    const previousBytes = JSON.stringify(previous)
    try {
        await Promise.all(["data", "public"].map(name => mkdir(path.join(directory, name))))
        const guard = path.join(directory, "no-network.ts")
        await Promise.all([
            writeFile(path.join(directory, "data", "most_used_kanjis.json"), JSON.stringify(previous.map(({ char }) => ({ char })))),
            writeFile(path.join(directory, "data", "jmdict-eng-3.6.2.json"), JSON.stringify({ words: [] })),
            writeFile(path.join(directory, "data", "jmdict-spa-3.6.1.json"), JSON.stringify(source)),
            writeFile(path.join(directory, "public", "kanjiset-v1.json"), previousBytes),
            writeFile(guard, 'globalThis.fetch = () => { throw new Error("External requests are forbidden in this fixture") }\n'),
        ])
        const builder = path.resolve(import.meta.dir, "../../../../../scripts/build-kanjiset.ts")
        const child = Bun.spawn([process.execPath, "--preload", guard, builder], {
            cwd: directory,
            stdout: "pipe",
            stderr: "pipe",
        })
        const [exitCode, stdout, stderr] = await Promise.all([
            child.exited,
            new Response(child.stdout).text(),
            new Response(child.stderr).text(),
        ])
        expect(stderr).toBe("")
        expect(exitCode).toBe(0)
        expect(stdout).toContain("playwright run: 0")
        const rebuilt = JSON.parse(await readFile(path.join(directory, "public", "kanjiset-v2.json"), "utf8"))
        expect(rebuilt).toEqual([
            { ...previous[0], meaning_es: "escuchar" },
            { ...previous[1], meaning_es: "día" },
            { ...previous[2], meaning_es: "vender" },
            { ...previous[3], meaning_es: null },
        ])
        expect(await readFile(path.join(directory, "public", "kanjiset-v1.json"), "utf8")).toBe(previousBytes)
    } finally {
        await rm(directory, { recursive: true, force: true })
    }
})
