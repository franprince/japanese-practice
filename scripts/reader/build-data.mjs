// Builds the static data the app loads at runtime:
//  public/reader/dict/*               kuromoji's IPADIC tokenizer dictionary
//  public/reader/data/words-*.json    JMdict entries [kanji[], kana[], senses, flags, jlpt, searchOnly[]?]
//                              where senses = [[pos labels], [glosses], [notes]]
//                              and flags bit 1 = common word
//  public/reader/data/kanji.json      KANJIDIC2 joyo kanji [char, meanings, onyomi, kunyomi, strokes, grade, jlpt]
//  public/reader/data/strokes.json    KanjiVG stroke paths { char: [path, ...] }
//
// Words come from the official JMdict_e (English) file of the EDRDG when it is
// at data-src/reader/JMdict_e.gz (or $JMDICT_PATH). With JMDICT_DOWNLOAD=1 the
// latest release is downloaded there first, as the Vercel and GitHub Pages
// builds do. Otherwise the JMdict common-word subset bundled in the
// kotobako-data npm package is used.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import { POS_LABELS } from './jmdict-labels.mjs'
import { parseJMdict } from './jmdict.mjs'

const require = createRequire(import.meta.url)
// Ported from Nihongo Rubi; output goes under public/reader so it doesn't mix with the practice data.
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const out = join(root, 'public', 'reader', 'data')
mkdirSync(out, { recursive: true })

cpSync(join(dirname(require.resolve('kuromoji/package.json')), 'dict'), join(root, 'public', 'reader', 'dict'), {
  recursive: true,
})

const bundled = JSON.parse(readFileSync(require.resolve('kotobako-data/kotobako-static.json'), 'utf8'))
const COMMON = 1

// JLPT levels from the bundled lists, keyed by written form and reading.
const jlpt = new Map()
for (const v of bundled.datasets.vocab) {
  if (!v.jlpt) continue
  for (const w of [v.word, v.altWord]) if (w) jlpt.set(`${w}\t${v.reading}`, v.jlpt)
}
const jlptOf = (kanji, kana) => {
  for (const r of kana) {
    for (const k of kanji.length ? kanji : [r]) {
      const level = jlpt.get(`${k}\t${r}`)
      if (level) return level
    }
  }
  return ''
}

function fromJMdict(path) {
  const { date, entries } = parseJMdict(gunzipSync(readFileSync(path)).toString('utf8'))
  return {
    source: `JMdict_e ${date} (EDRDG)`,
    words: entries.map((e) => [
      e.kanji,
      e.kana,
      e.senses.map((s) => [s.pos, s.gloss, s.notes]),
      e.common ? COMMON : 0,
      jlptOf(e.kanji, e.kana),
      ...(e.hidden.length ? [e.hidden] : []),
    ]),
  }
}

function fromBundled() {
  const seen = new Set()
  const words = []
  for (const v of bundled.datasets.vocab) {
    const kanji = [v.word, v.altWord].filter((w) => w && w !== v.reading)
    const key = [...kanji, v.reading, v.meanings.join('|')].join('\t')
    if (seen.has(key)) continue
    seen.add(key)
    const pos = v.pos ? v.pos.split(' · ').map((p) => POS_LABELS[p] ?? p) : []
    words.push([kanji, [v.reading], [[pos, v.meanings, []]], COMMON, v.jlpt ?? ''])
  }
  return { source: `JMdict common subset (jmdict-simplified ${bundled.version.split(' ')[0]})`, words }
}

const JMDICT_URL = 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz'
const jmdictPath = process.env.JMDICT_PATH ?? join(root, 'data-src', 'reader', 'JMdict_e.gz')

if (process.env.JMDICT_DOWNLOAD === '1') {
  try {
    const res = await fetch(JMDICT_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    mkdirSync(dirname(jmdictPath), { recursive: true })
    writeFileSync(jmdictPath, Buffer.from(await res.arrayBuffer()))
  } catch (err) {
    console.warn(`JMdict download failed (${err.cause?.message ?? err.message}); using what is available locally`)
  }
}
const { source, words } = existsSync(jmdictPath) ? fromJMdict(jmdictPath) : fromBundled()

// Common words load first; the rest of JMdict streams in afterwards.
const common = words.filter((w) => w[3] & COMMON)
const rest = words.filter((w) => !(w[3] & COMMON))
writeFileSync(join(out, 'words-common.json'), JSON.stringify(common))
writeFileSync(join(out, 'words-rest.json'), JSON.stringify(rest))

const { kanji } = bundled.datasets
writeFileSync(
  join(out, 'kanji.json'),
  JSON.stringify(kanji.map((k) => [k.char, k.meanings, k.onyomi, k.kunyomi, k.strokeCount, k.grade, k.jlpt ?? ''])),
)
writeFileSync(join(out, 'strokes.json'), JSON.stringify(Object.fromEntries(kanji.map((k) => [k.char, k.strokes]))))
writeFileSync(
  join(out, 'meta.json'),
  JSON.stringify({ words: source, kanji: `KANJIDIC2 / KanjiVG (${bundled.version.split(' / ')[1]})` }),
)

console.log(`data: ${common.length} common + ${rest.length} other words from ${source}; ${kanji.length} kanji`)
