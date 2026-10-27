import { ChevronDown, X } from 'lucide-react'
import { transcriptions, type ReadingLine } from '../lib/analyze'
import { toTag } from '../lib/languages'
import { LanguagePicker } from './LanguagePicker'
import {
  DictionaryFootnote,
  DisplayControls,
  ProviderBadge,
  Reading,
  TranscriptionRows,
  TranslationContent,
  TranslationLinks,
  type DisplayOptions,
  type LanguageControls,
  type Translation,
} from './SentenceView'
import { SegmentCard } from './WordCard'
import { Card, CopyButton, IconButton, Skeleton, SpeakButton } from './ui'

export function LyricsView({ text, lines, translation, options, onOptions, language, selected, onSelect, onKanji }: {
  text: string
  lines: ReadingLine[]
  translation?: Translation
  options: DisplayOptions
  onOptions: (o: DisplayOptions) => void
  language: LanguageControls
  selected?: number
  onSelect: (index: number) => void
  onKanji: (char: string) => void
}) {
  const readings = lines.map((line) => transcriptions(line.segments))
  const groups = translation?.status === 'done'
    ? translation.groups ?? (translation.lines
      ? translation.lines.map((text, i) => ({ start: i, end: i, text }))
      : [{ start: 0, end: lines.length - 1, text: translation.value }])
    : lines.map((_, i) => ({ start: i, end: i, text: '' }))

  const pending = !translation || translation.status === 'loading'

  return (
    <Card>
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-t-2xl border-b border-border bg-card/95 px-3 py-3 backdrop-blur-md sm:px-4">
        <div className="flex items-center gap-1">
          <LanguagePicker {...language} />
          {translation?.status === 'done' && <CopyButton text={translation.value} label="Copy translation" />}
        </div>
        <DisplayControls text={text} options={options} onOptions={onOptions} />
      </div>
      {translation?.status === 'error' && (
        <div className="border-b border-border px-5 py-4">
          <TranslationContent translation={translation} />
        </div>
      )}
      <div role="list" aria-label="Lyrics">
        {groups.map((group) => {
          const source = lines.slice(group.start, group.end + 1)
          if (source.every((line) => !line.text.trim())) {
            return <div key={group.start} aria-hidden="true" className="h-6 bg-background" />
          }
          return (
            <div
              key={group.start}
              role="listitem"
              className="border-b border-border px-4 py-4 last:border-b-0 sm:px-5"
            >
              <div className={`grid min-w-0 gap-3 ${translation?.status === 'done' || pending ? 'md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-8' : ''}`}>
                <div className="min-w-0 space-y-3">
                  {source.map((line, offset) => {
                    const i = group.start + offset
                    if (!line.text.trim()) return <div key={i} aria-hidden="true" className="h-6" />
                    const word = line.segments.find((s) => s.type === 'word' && s.index === selected)
                    return (
                      <div key={i}>
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <Reading
                              segments={line.segments}
                              options={{ ...options, romaji: false }}
                              selected={selected}
                              onSelect={onSelect}
                              className="text-xl sm:text-2xl"
                            />
                            {options.romaji && (
                              <p className="break-words text-sm leading-relaxed text-muted-foreground">
                                {readings[i]!.romaji}
                              </p>
                            )}
                          </div>
                          <SpeakButton text={line.text} label={`Listen to line ${i + 1}`} />
                        </div>
                        {word && (
                          <div id={`word-${word.index}`} className="mt-3 max-w-xl">
                            <div className="mb-1 flex justify-end">
                              <IconButton label="Close word details" onClick={() => onSelect(word.index)}>
                                <X className="size-4" />
                              </IconButton>
                            </div>
                            <SegmentCard key={word.index} segment={word} onKanji={onKanji} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {pending && (
                  <div role="status" aria-label="Translating" className="min-w-0 self-center">
                    <Skeleton widths={source.map((_, i) => ['90%', '65%', '78%'][i % 3]!)} className="py-1" />
                  </div>
                )}
                {translation?.status === 'done' && (
                  <div className="min-w-0 self-center" lang={language.target ? toTag(language.target) : undefined} dir="auto">
                    <TranslationContent translation={{ ...translation, value: group.text }} attribution={false} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 sm:px-4">
        <TranslationLinks text={text} target={language.target} />
        <div className="flex items-center gap-2">
          {translation?.status === 'done' && <ProviderBadge provider={translation.provider} />}
        </div>
      </div>
      <details className="group border-t border-border">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
          <span>かな / romaji</span>
          <ChevronDown className="size-4 transition group-open:rotate-180" />
        </summary>
        <div className="divide-y divide-border border-t border-border">
          <TranscriptionRows
            hiragana={readings.map((line) => line.hiragana).join('\n')}
            romaji={readings.map((line) => line.romaji).join('\n')}
          />
        </div>
      </details>
      <DictionaryFootnote target={language.target} />
    </Card>
  )
}
