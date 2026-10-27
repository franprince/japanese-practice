import { RotateCcw, X } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { getKanji, getStrokes, wordsWithKanji } from '../lib/dictionary'
import { hepburn, toRomaji } from '../lib/japanese'
import { Badge, IconButton, SpeakButton } from './ui'

function StrokeOrder({ char }: { char: string }) {
  const [paths, setPaths] = useState<string[] | null | undefined>()
  const [run, setRun] = useState(0)
  // Keyed by char by its parent, so each kanji starts from an empty state.
  useEffect(() => {
    getStrokes(char).then((p) => setPaths(p ?? null), () => setPaths(null))
  }, [char])

  return (
    <div className="relative">
      <div className="genko-cell relative size-36 overflow-hidden bg-card">
        {paths ? (
          <svg viewBox="0 0 109 109" className="absolute inset-0 size-full" aria-label={`Stroke order of ${char}`}>
            <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2">
              <g className="stroke-border">
                {paths.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
              <g key={run} className="stroke-anim stroke-foreground">
                {paths.map((d, i) => (
                  <path key={i} d={d} pathLength={1} style={{ animationDelay: `${i * 0.55}s` }} />
                ))}
              </g>
            </g>
          </svg>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-hand text-8xl">{char}</div>
        )}
      </div>
      {paths && (
        <div className="absolute -right-2 -bottom-2 rounded-xl bg-card shadow-md">
          <IconButton label="Replay stroke order" onClick={() => setRun(run + 1)}>
            <RotateCcw className="size-4" />
          </IconButton>
        </div>
      )}
    </div>
  )
}

/** On'yomi are written in katakana and kun'yomi in hiragana, so the script itself tells them apart. */
function Readings({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div role="group" aria-label={label}>
      <div className="flex flex-wrap gap-1.5">
        {items.map((r) => {
          // KANJIDIC marks okurigana with a dot (つ.ぐ) and affixes with a dash.
          const [stem, okurigana = ''] = r.split('.')
          return (
            <span
              key={r}
              className="inline-flex items-baseline gap-1.5 rounded-lg bg-secondary px-2 py-1"
            >
              <span className="font-hand">
                {stem}
                {okurigana && <span className="text-muted-foreground">{okurigana}</span>}
              </span>
              <span className="text-xs text-muted-foreground">
                {/* Long vowels join only within the stem: おお.きい → ōkii, と.う → tou. */}
                {hepburn(stem!.replace(/-/g, '')) + toRomaji(okurigana)}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** The kanji's details: stroke order, meanings, readings and words that use it. */
export function KanjiDetails({ char, onKanji, actions }: { char: string; onKanji: (c: string) => void; actions?: React.ReactNode }) {
  const k = getKanji(char)
  const examples = wordsWithKanji(char)
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-5">
        <StrokeOrder key={char} char={char} />
        <div className="min-w-0 flex-1 space-y-2 pt-1">
          {actions && <div className="flex justify-end gap-1">{actions}</div>}
          {k && (
            <>
              <p className="font-hand text-lg font-medium leading-snug">{k.meanings.join(', ')}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge>{k.strokeCount} strokes</Badge>
                {k.jlpt && <Badge tone="accent">JLPT {k.jlpt}</Badge>}
              </div>
            </>
          )}
        </div>
      </div>
      {k && (
        <div className="space-y-2">
          <Readings label="On'yomi" items={k.onyomi} />
          <Readings label="Kun'yomi" items={k.kunyomi} />
        </div>
      )}
      {examples.length > 0 && (
        <div className="border-t border-dashed border-border pt-2">
          <ul className="divide-y divide-border" aria-label={`Words with ${char}`}>
            {examples.map((w) => (
              <li key={w.id} className="flex items-baseline gap-3 py-2">
                <span className="shrink-0 font-hand text-lg">
                  {[...w.kanji[0]!].map((c, i) =>
                    c !== char && getKanji(c) ? (
                      <button key={i} type="button" onClick={() => onKanji(c)} className="hover:text-primary">
                        {c}
                      </button>
                    ) : (
                      <span key={i} className={c === char ? 'text-primary' : ''}>
                        {c}
                      </span>
                    ),
                  )}
                </span>
                <span className="shrink-0 font-hand text-sm text-primary">{w.kana[0]}</span>
                <span className="min-w-0 truncate text-sm text-muted-foreground">{w.senses[0]?.glosses.slice(0, 3).join(', ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Bottom sheet for narrow screens; wide screens show KanjiDetails in the page's side panel. */
export function KanjiSheet({ char, onClose, onKanji }: { char: string; onClose: () => void; onKanji: (c: string) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={`Kanji ${char}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div className="relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-[20px] border border-border bg-card shadow-2xl">
        <div className="overflow-y-auto px-5 py-5">
          <KanjiDetails
            char={char}
            onKanji={onKanji}
            actions={<>
              <SpeakButton text={char} />
              <IconButton label="Close" onClick={onClose}>
                <X className="size-4" />
              </IconButton>
            </>}
          />
        </div>
      </div>
    </div>
  )
}
