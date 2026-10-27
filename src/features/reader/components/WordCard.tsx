import { ArrowRight, ChevronDown } from 'lucide-react'
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Segment } from '../lib/analyze'
import { getKanji, type Word } from '../lib/dictionary'
import { furigana, hepburn, isKanji, type FuriganaPart } from '../lib/japanese'
import { Badge, Card, Ruby, SpeakButton } from './ui'

const POS_CLASS = 'text-[11px] font-medium uppercase tracking-wide text-muted-foreground'

/** "+3" that expands a list; the count says what it opens, so it carries no other text. */
function More({ count, open, onToggle, label }: { count: number; open: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
    >
      <ChevronDown className={`size-3.5 transition ${open ? 'rotate-180' : ''}`} />
      {open ? '' : `+${count}`}
    </button>
  )
}

function Senses({ word, max = 5 }: { word: Word; max?: number }) {
  const [all, setAll] = useState(false)
  const senses = all ? word.senses : word.senses.slice(0, max)
  return (
    <div>
      <ol className="space-y-1.5">
        {senses.map((s, i) => {
          const pos = s.pos.join(', ')
          // A part of speech is shown once, above the first sense it applies to.
          const showPos = pos && pos !== (i ? senses[i - 1]!.pos.join(', ') : '')
          return (
            <li key={i} className="text-sm leading-relaxed">
              {showPos && <div className={`mb-0.5 ${POS_CLASS}`}>{pos}</div>}
              <span className="mr-1.5 text-muted-foreground tabular-nums">{i + 1}.</span>
              {/* Subject, register or dialect (computing, honorific, Kansai dialect…) before the meaning, as JMdict tags it. */}
              {s.notes.map((n) => (
                <span key={n} className="mr-1 inline-block align-[1px]">
                  <Badge>{n}</Badge>
                </span>
              ))}
              <span className="text-foreground">{s.glosses.join('; ')}</span>
            </li>
          )
        })}
      </ol>
      {word.senses.length > max && (
        <div className="mt-1.5">
          <More
            count={word.senses.length - max}
            open={all}
            onToggle={() => setAll(!all)}
            label={all ? 'Fewer meanings' : `${word.senses.length - max} more meanings`}
          />
        </div>
      )}
    </div>
  )
}

/** The kanji the side panel shows (wide screens only); chips for it are marked as open. */
export const ActiveKanji = createContext<string | undefined>(undefined)

/** Says where a click on a kanji goes: the side panel on wide screens, a sheet on narrow ones. */
export function KanjiHint({ wide }: { wide: boolean }) {
  return (
    <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span lang="ja" aria-hidden="true" className="inline-flex size-5 items-center justify-center rounded border border-border bg-card font-hand text-[13px] text-foreground">字</span>
      {wide ? 'Click a kanji to see it in the panel' : 'Tap a kanji for its details'}
      {wide && <ArrowRight className="size-3.5" aria-hidden="true" />}
    </span>
  )
}

export function KanjiChips({ text, extra = '', onKanji }: { text: string; extra?: string; onKanji: (c: string) => void }) {
  const active = useContext(ActiveKanji)
  // Kanji from `extra` (another spelling of the word) only appear when KANJIDIC has them.
  const chars = [...new Set([...text].filter(isKanji).concat([...extra].filter((c) => isKanji(c) && getKanji(c))))]
  if (!chars.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {chars.map((c) => {
        const k = getKanji(c)
        const open = active === c
        const label = active !== undefined ? `Show ${c} in the kanji panel` : `Kanji ${c}`
        return (
          <button
            key={c}
            type="button"
            onClick={() => onKanji(c)}
            aria-label={label}
            title={label}
            aria-pressed={active !== undefined ? open : undefined}
            className={`group inline-flex items-center gap-1.5 rounded-lg border p-1 text-left transition hover:border-primary hover:bg-primary/10 ${
              open ? 'border-primary bg-primary/10' : 'border-border bg-background'
            }`}
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-card font-hand text-lg leading-none shadow-sm">
              {c}
            </span>
            {k && (
              <span className={`max-w-[9rem] truncate text-xs group-hover:text-primary ${open ? 'text-primary' : 'text-muted-foreground'}`}>
                {k.meanings.slice(0, 2).join(', ')}
              </span>
            )}
            <ArrowRight
              aria-hidden="true"
              className={`mr-0.5 size-3.5 shrink-0 transition group-hover:translate-x-0.5 group-hover:text-primary ${open ? 'text-primary' : 'text-muted-foreground/70'}`}
            />
          </button>
        )
      })}
    </div>
  )
}

/** Head of a card: the word with furigana, then its romaji, other spellings and JLPT level on one line. */
function Head({
  parts,
  romaji,
  word,
  shown,
  speakText,
}: {
  parts: FuriganaPart[]
  romaji: string
  word?: Word
  /** Forms already visible (the word and its reading), left out of the other spellings. */
  shown: string[]
  speakText: string
}) {
  const others = word ? [...word.kanji, ...word.kana].filter((f) => !shown.includes(f)) : []
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="font-hand text-3xl font-medium leading-[1.9]">
          <Ruby parts={parts} />
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-primary">{romaji}</span>
          {others.length > 0 && (
            <span className="font-hand text-sm text-muted-foreground" title="Other spellings">
              {others.join('・')}
            </span>
          )}
          {word?.jlpt && <Badge tone="accent">JLPT {word.jlpt}</Badge>}
        </div>
      </div>
      <SpeakButton text={speakText} />
    </div>
  )
}

/** Dictionary form ← the pieces of the inflected word, each with what it adds: 読む ← 読ん + で (te-form) + … */
function Inflection({ segment, headword, reading }: { segment: Segment; headword: string; reading: string }) {
  const pieces: ReactNode[] = segment.parts.map((p, i) => (
    <span key={i} className="inline-flex items-center gap-1">
      {i > 0 && <span className="text-muted-foreground/70">+</span>}
      <span className="rounded-md bg-card px-1.5 py-0.5 font-hand shadow-sm">{p.surface}</span>
      {p.note && <span className="text-xs text-muted-foreground">{p.note}</span>}
    </span>
  ))
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl bg-background px-3 py-2 text-sm">
      <span className="font-hand text-base font-medium" title="Dictionary form">
        <Ruby parts={furigana(headword, reading)} />
      </span>
      {pieces.length > 1 && (
        <>
          <span className="text-muted-foreground" aria-hidden="true">
            ←
          </span>
          {pieces}
        </>
      )}
    </div>
  )
}

/** One word of the analyzed text, with its inflection breakdown and dictionary entry. */
export function SegmentCard({
  segment,
  onKanji,
  highlighted,
}: {
  segment: Segment
  onKanji: (c: string) => void
  highlighted?: boolean
}) {
  const [showOthers, setShowOthers] = useState(false)
  const [main, ...others] = segment.entries
  const headword = main ? (main.kanji.find((k) => k === segment.base) ?? main.kanji[0] ?? main.kana[0] ?? segment.base) : segment.base
  const conjugated = segment.parts.length > 0 || segment.base !== segment.surface

  return (
    <Card
      className={`flex flex-col gap-3 p-4 transition ${highlighted ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
    >
      <Head
        parts={segment.furigana}
        romaji={segment.romaji}
        word={main}
        shown={[segment.surface, segment.base, segment.reading, headword, main?.kana[0] ?? '']}
        speakText={segment.surface}
      />

      {conjugated && <Inflection segment={segment} headword={headword} reading={main?.kana[0] ?? ''} />}

      {/* Without a dictionary entry, the tokenizer's part of speech is all there is to say. */}
      {main ? <Senses word={main} /> : <p className={POS_CLASS}>{segment.posLabel}</p>}

      <KanjiChips text={segment.surface} extra={main?.kanji[0]} onKanji={onKanji} />

      {others.length > 0 && (
        <div className="border-t border-border pt-2">
          <More
            count={others.length}
            open={showOthers}
            onToggle={() => setShowOthers(!showOthers)}
            label={`${others.length} other dictionary ${others.length === 1 ? 'match' : 'matches'}`}
          />
          {showOthers && (
            <ul className="mt-2 space-y-2">
              {others.slice(0, 6).map((w) => (
                <li key={w.id} className="text-sm">
                  <span className="font-hand font-medium">{w.kanji[0] ?? w.kana[0]}</span>
                  {w.kanji.length > 0 && <span className="ml-1 font-hand text-muted-foreground">【{w.kana[0]}】</span>}
                  <span className="ml-2 text-muted-foreground">
                    {w.senses
                      .slice(0, 3)
                      .map((s) => s.glosses.slice(0, 2).join(', '))
                      .join('; ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  )
}

/** Godan verbs in -u (思う, 言う) end in a う that is not a long vowel; suru nouns like 勉強 do not. */
const endsInVerbU = (w: Word) => w.senses.some((s) => s.pos.some((p) => p.startsWith('godan verb')))

/** A dictionary entry on its own (English search results). */
export function EntryCard({ word, onKanji }: { word: Word; onKanji: (c: string) => void }) {
  // Every JMdict entry has at least one kana form.
  const reading = word.kana[0]!
  const written = word.kanji[0] ?? reading
  return (
    <Card className="flex flex-col gap-3 p-4">
      <Head parts={furigana(written, reading)} romaji={hepburn(reading, endsInVerbU(word))} word={word} shown={[written, reading]} speakText={reading} />
      <Senses word={word} />
      <KanjiChips text={written} onKanji={onKanji} />
    </Card>
  )
}
