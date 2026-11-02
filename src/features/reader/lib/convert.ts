// Kana-to-kanji conversion for the input method: the cheapest path through a lattice of dictionary
// words (Viterbi over IPADIC's word and connection costs), grouped into phrases (文節) whose head
// word can be swapped for the other words with the same reading.
import { hasKanji, hiraToKata, kataToHira } from './japanese'

export type Entry = {
  surface: string
  left: number
  right: number
  cost: number
  /** IPADIC part of speech, its first subclass and the base form: 名詞, 一般, 漢字. */
  pos: string
  sub: string
  base: string
  /** For a kana copy of a word usually written in kana: the spelling its bonus is looked up by. */
  spelling?: string
}

export type Lexicon = {
  /** Words read exactly as `reading` (hiragana). */
  lookup(reading: string): Entry[]
  /** Cost of a word with right id `right` followed by one with left id `left`; 0 is the sentence edge. */
  connect(right: number, left: number): number
  /** Subtracted from a word's cost: common and JLPT vocabulary, for learners. */
  bonus?(entry: Entry, reading: string): number
}

/** A phrase of the conversion: the kana it was read from and its spellings, best first. */
export type Phrase = { reading: string; candidates: string[] }

type Node = Entry & { start: number; end: number }
type Step = { cost: number; node?: Node; prev?: Step }

const MAX_WORD = 16
const UNKNOWN = 20000
// IPADIC lists many words in katakana as well; kana typed in hiragana rarely means them.
const KATAKANA_PENALTY = 2500
const KATAKANA = /^[\p{Script=Katakana}ー]+$/u
// Numerals typed as kana (に, ご) are nearly always particles or parts of words: にほん is 日本, not 二本.
const NUMERAL_PENALTY = 3000
const SUFFIX_PENALTY = 700
// Words everyday writing keeps in kana, by dictionary form: each gets a kana copy and its kanji
// spellings cost more, though they stay among the candidates.
const USUALLY_KANA = new Set([
  '居る', '有る', '在る', '無い', '下さる', '頂く', '為る', '出来る', '致す', '御座る', '宜しい', '有難う', 'お早う',
  '此の', '其の', '彼の', '何故', '迄', '位', '程', '等', '達', '又', '既に', '色々', '所', '事', '様',
  '林檎', '煙草', '一寸', '矢張り', '沢山', '丁度', '殆ど', '先ず', '直ぐ', '未だ', '若し', '然し', '但し',
])
const USUALLY_KANA_PENALTY = 3000
const DEPENDENT = new Set(['接尾', '非自立', '接続詞的', '数'])

/** The words read as `reading`, plus a kana copy of each one usually written in kana. */
function lookup(lexicon: Lexicon, reading: string): Entry[] {
  const entries = lexicon.lookup(reading)
  const copies = entries
    .filter((e) => USUALLY_KANA.has(e.base) && hasKanji(e.surface))
    .map((e) => ({ ...e, surface: reading, spelling: e.surface }))
  return copies.length ? [...entries, ...copies] : entries
}

function costOf(lexicon: Lexicon, entry: Entry, reading: string, typed: string) {
  let cost = entry.cost
  // Only words that stand on their own get the bonus, a single kanji half of it: in full it would
  // outbid grammar (いきたい → 行き対 instead of 行きたい).
  if (!DEPENDENT.has(entry.sub)) {
    const spelling = entry.spelling ?? entry.surface
    const bonus = lexicon.bonus?.({ ...entry, surface: spelling }, reading) ?? 0
    cost -= [...spelling].length > 1 ? bonus : bonus / 2
  }
  // A long vowel mark (らーめん) is how katakana words are typed.
  if (KATAKANA.test(entry.surface) && !KATAKANA.test(typed) && !typed.includes('ー')) cost += KATAKANA_PENALTY
  if (entry.sub === '数') cost += NUMERAL_PENALTY
  if (USUALLY_KANA.has(entry.base) && hasKanji(entry.surface)) cost += USUALLY_KANA_PENALTY
  // Helper verbs are written in kana (食べている, not 食べて居る), and a kanji suffix read like a
  // grammar ending (帯 and たい) needs a little more to win.
  if ((entry.sub === '接尾' || entry.sub === '非自立') && hasKanji(entry.surface)) cost += SUFFIX_PENALTY
  return cost
}

/** The cheapest reading of `kana` as a sequence of dictionary words. */
function bestPath(kana: string, lexicon: Lexicon): Node[] {
  const n = kana.length
  // best[i]: by right id, the cheapest path covering kana[0, i) that ends in a word with that id.
  const best: Map<number, Step>[] = Array.from({ length: n + 1 }, () => new Map())
  best[0]!.set(0, { cost: 0 })
  for (let i = 0; i < n; i++) {
    if (!best[i]!.size) continue
    for (let j = i + 1; j <= Math.min(n, i + MAX_WORD); j++) {
      const typed = kana.slice(i, j)
      const reading = kataToHira(typed)
      let entries = lookup(lexicon, reading)
      // A character no word starts with is kept as typed, so every input has a path.
      if (!entries.length && j === i + 1) entries = [{ surface: typed, left: 0, right: 0, cost: UNKNOWN, pos: '', sub: '', base: '' }]
      for (const entry of entries) {
        const cost = costOf(lexicon, entry, reading, typed)
        for (const [right, step] of best[i]!) {
          const total = step.cost + lexicon.connect(right, entry.left) + cost
          const current = best[j]!.get(entry.right)
          if (!current || total < current.cost) {
            best[j]!.set(entry.right, { cost: total, prev: step, node: { ...entry, surface: entry.surface, start: i, end: j } })
          }
        }
      }
    }
  }
  let end: Step | undefined
  let endCost = Infinity
  for (const [right, step] of best[n]!) {
    const total = step.cost + lexicon.connect(right, 0)
    if (total < endCost) [end, endCost] = [step, total]
  }
  const nodes: Node[] = []
  for (let step = end; step?.node; step = step.prev) nodes.unshift(step.node)
  return nodes
}

/** Words that lean on the one before them: particles, auxiliaries and dependent or suffix forms. */
function attaches(node: Node, prev: Node): boolean {
  if (node.pos === '助詞' || node.pos === '助動詞') return true
  if (node.sub === '非自立' || node.sub === '接尾') return true
  // する after a verbal noun: 勉強|します is one phrase.
  if (node.pos === '動詞' && node.base === 'する' && prev.sub === 'サ変接続') return true
  if (node.pos === '記号' && prev.pos !== '記号') return true
  return false
}

/** Converts a run of kana into phrases with their candidate spellings, the best reading first. */
export function convert(kana: string, lexicon: Lexicon, limit = 30): Phrase[] {
  if (!kana) return []
  const nodes = bestPath(kana, lexicon)
  const groups: Node[][] = []
  nodes.forEach((node, i) => {
    if (i > 0 && attaches(node, nodes[i - 1]!)) groups.at(-1)!.push(node)
    else groups.push([node])
  })
  return groups.map((group, g) => {
    const [head, ...rest] = group as [Node, ...Node[]]
    const tail = rest.map((n) => n.surface).join('')
    const typed = kana.slice(head.start, head.end)
    const reading = kataToHira(typed)
    const before = groups[g - 1]?.at(-1)?.right ?? 0
    const after = rest[0]?.left ?? groups[g + 1]?.[0]?.left ?? 0
    // The other words read like the head, ranked by how well they fit between their neighbours.
    const scored = new Map<string, number>()
    for (const entry of lookup(lexicon, reading)) {
      const cost = lexicon.connect(before, entry.left) + costOf(lexicon, entry, reading, typed) + lexicon.connect(entry.right, after)
      if (cost < (scored.get(entry.surface) ?? Infinity)) scored.set(entry.surface, cost)
    }
    const heads = [...new Set([head.surface, ...[...scored].sort((a, b) => a[1] - b[1]).map(([s]) => s)])]
    // Plain kana is always offered, hiragana near the top as other input methods do.
    const hira = kataToHira(typed)
    if (!heads.includes(hira)) heads.splice(Math.min(2, heads.length), 0, hira)
    heads.push(hiraToKata(typed))
    const candidates = [...new Set(heads.map((h) => h + tail))].slice(0, limit)
    return { reading: kana.slice(head.start, group.at(-1)!.end), candidates }
  })
}
