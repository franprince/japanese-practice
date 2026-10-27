import type { TranslationGroup } from './translationTypes.js'

type Row = { index: number; text: string; offset: number }
type Cut = { source: number; target: number }
type Block = { start: number; end: number; from: number; to: number }
// Target offsets are UTF-16 positions into the untouched provider text, including whitespace.
export type TranslationSpan = { start: number; end: number; from: number; to: number }

const lexical = (text: string) => /[\p{L}\p{N}]/u.test(text)
const endings = (text: string) => (text.match(/[。！？؟]+|[.!?]+(?=\s|$|[”’」』»"')\]])/gu) ?? []).length
const terminal = (text: string) => /[。！？؟.!?][\s”’」』»"')\]]*$/u.test(text)
// A target line that runs past a finished source sentence carries part of the next line's meaning.
const continues = (source: Row, target: Row) => terminal(source.text) && !terminal(target.text)

function anchors(rows: Row[]): Map<string, number[]> {
  const found = new Map<string, number[]>()
  for (const [i, row] of rows.entries()) {
    for (const token of row.text.normalize('NFKC').toLowerCase().match(/[\p{Script=Latin}\p{N}]+/gu) ?? []) {
      if (token.length < 2 && !/^\p{N}+$/u.test(token)) continue
      const indices = found.get(token) ?? []
      indices.push(i)
      found.set(token, indices)
    }
  }
  return found
}

/** Structural evidence is fallible; unresolved intervals retain a shared translation. */
export function alignSpans(lines: string[], text: string): TranslationSpan[] {
  if (!lines.length) {
    if (text) throw new Error('Translation has no source lines')
    return []
  }
  const source = lines.flatMap((line, index) => line.trim() ? [{ index, text: line.trim(), offset: 0 }] : [])
  const target: Row[] = []
  let index = 0
  for (const match of text.matchAll(/[^\r\n]*(?:\r\n|\r|\n|$)/g)) {
    if (match[0].trim()) target.push({ index, text: match[0].trim(), offset: match.index })
    index++
  }
  if (!source.length || !target.length) return [{ start: 0, end: lines.length - 1, from: 0, to: text.length }]

  const sourceAnchors = anchors(source)
  const targetAnchors = anchors(target)
  const points: Cut[] = []
  for (const [token, indices] of sourceAnchors) {
    const other = targetAnchors.get(token)
    // Repeated words/numbers cannot establish which occurrence owns the translation.
    if (indices.length === 1 && other?.length === 1) points.push({ source: indices[0]!, target: other[0]! })
  }
  points.sort((a, b) => a.source - b.source || a.target - b.target)
  const blocks: Block[] = []
  for (const point of points) {
    const block = { start: point.source, end: point.source, from: point.target, to: point.target }
    // Overlapping or reordered evidence belongs to one contiguous span in both languages.
    while (blocks.length && (blocks.at(-1)!.end >= block.start || blocks.at(-1)!.to >= block.from)) {
      const previous = blocks.pop()!
      block.start = Math.min(previous.start, block.start)
      block.end = Math.max(previous.end, block.end)
      block.from = Math.min(previous.from, block.from)
      block.to = Math.max(previous.to, block.to)
    }
    blocks.push(block)
  }

  const cuts: Cut[] = [{ source: 0, target: 0 }, { source: source.length, target: target.length }]
  const section = (start: number, end: number, from: number, to: number, paragraphs = true) => {
    const a = source.slice(start, end)
    const b = target.slice(from, to)
    if (!a.length || !b.length) return
    const gaps = (rows: Row[]) => rows.flatMap((row, i) => i && row.index > rows[i - 1]!.index + 1 ? [i] : [])
    const sourceGaps = paragraphs ? gaps(a) : []
    const targetGaps = paragraphs ? gaps(b) : []
    if (sourceGaps.length && sourceGaps.length === targetGaps.length) {
      let s = start
      let t = from
      for (let i = 0; i <= sourceGaps.length; i++) {
        const nextS = i < sourceGaps.length ? start + sourceGaps[i]! : end
        const nextT = i < targetGaps.length ? from + targetGaps[i]! : to
        section(s, nextS, t, nextT, false)
        cuts.push({ source: nextS, target: nextT })
        s = nextS
        t = nextT
      }
      return
    }
    const cumulative = (rows: Row[]) => {
      let count = 0
      return rows.map(row => count += endings(row.text))
    }
    const sourceEnds = cumulative(a)
    const targetEnds = cumulative(b)
    const marked = sourceEnds.at(-1)! > 0 && targetEnds.at(-1)! > 0
    // Lyric lines often lack the marks a translation adds, so only fully punctuated text has sentence structure.
    if (a.length === b.length && !(marked && a.every(row => terminal(row.text)))) {
      // Retained line formatting is a candidate, not a claim of semantic certainty.
      const suspicious = a.map((row, i) => lexical(row.text) && !lexical(b[i]!.text))
      for (let i = 1; i < a.length; i++) {
        if (!suspicious[i - 1] && !suspicious[i] && !(marked && continues(a[i - 1]!, b[i - 1]!))) {
          cuts.push({ source: start + i, target: from + i })
        }
      }
    } else if (marked) {
      // Balanced counts can still hide a shifted boundary inside a sentence.
      if (sourceEnds.at(-1) !== targetEnds.at(-1)) return
      const targetCuts = new Map<number, number>()
      b.forEach((row, i) => { if (terminal(row.text)) targetCuts.set(targetEnds[i]!, from + i + 1) })
      a.forEach((row, i) => {
        const t = targetCuts.get(sourceEnds[i]!)
        if (terminal(row.text) && t !== undefined) cuts.push({ source: start + i + 1, target: t })
      })
    }
  }
  let s = 0
  let t = 0
  for (const block of blocks) {
    section(s, block.start, t, block.from)
    cuts.push({ source: block.start, target: block.from }, { source: block.end + 1, target: block.to + 1 })
    s = block.end + 1
    t = block.to + 1
  }
  section(s, source.length, t, target.length)

  // Local hints must not override a complete sentence that visibly crosses the proposed boundary.
  const sourceEnds = source.map(row => endings(row.text))
  const targetEnds = target.map(row => endings(row.text))
  const sourceTotal = sourceEnds.reduce((sum, count) => sum + count, 0)
  const targetTotal = targetEnds.reduce((sum, count) => sum + count, 0)
  const compatible = (cut: Cut) => {
    if (!cut.source && !cut.target || cut.source === source.length && cut.target === target.length) return true
    if (points.some(point => (point.source < cut.source) !== (point.target < cut.target))) return false
    if (sourceTotal && targetTotal && sourceTotal === targetTotal) {
      // An unpunctuated line is no evidence of a crossing sentence; unequal counts before the cut are.
      return cut.source > 0 && cut.target > 0 && !continues(source[cut.source - 1]!, target[cut.target - 1]!) &&
        sourceEnds.slice(0, cut.source).reduce((sum, count) => sum + count, 0) ===
        targetEnds.slice(0, cut.target).reduce((sum, count) => sum + count, 0)
    }
    return true
  }
  const unique = [...new Map(cuts.filter(compatible).map(cut => [`${cut.source}:${cut.target}`, cut])).values()]
    .sort((a, b) => a.source - b.source || a.target - b.target)
  const sourceCounts = new Map<number, number>()
  const targetCounts = new Map<number, number>()
  for (const cut of unique) {
    sourceCounts.set(cut.source, (sourceCounts.get(cut.source) ?? 0) + 1)
    targetCounts.set(cut.target, (targetCounts.get(cut.target) ?? 0) + 1)
  }
  // A source-only or target-only gap cannot be assigned to either neighbor confidently.
  const boundaries = unique.filter((cut, i) => !i || i === unique.length - 1 ||
    sourceCounts.get(cut.source) === 1 && targetCounts.get(cut.target) === 1)
  const spans: TranslationSpan[] = []
  let sourceIndex = 0
  for (let i = 1; i < boundaries.length; i++) {
    const before = boundaries[i - 1]!
    const after = boundaries[i]!
    const from = before.target ? target[before.target]!.offset : 0
    const to = after.target === target.length ? text.length : target[after.target]!.offset
    const start = source[before.source]!.index
    const end = source[after.source - 1]!.index
    while (sourceIndex < start) spans.push({ start: sourceIndex, end: sourceIndex++, from, to: from })
    spans.push({ start, end, from, to })
    sourceIndex = end + 1
  }
  while (sourceIndex < lines.length) {
    spans.push({ start: sourceIndex, end: sourceIndex++, from: text.length, to: text.length })
  }
  return spans
}

export function alignTranslation(lines: string[], text: string): { text: string; groups: TranslationGroup[] } {
  return { text, groups: alignSpans(lines, text).map(({ start, end, from, to }) => ({
    start, end, text: text.slice(from, to).trim(),
  })) }
}
