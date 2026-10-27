import { ExternalLink } from 'lucide-react'
import type { Segment } from '../lib/analyze'
import type { Provider } from '../lib/translate'
import type { TranslationGroup } from '../lib/translationTypes'
import { hiraToKata } from '../lib/japanese'
import { googleCode, toTag, type Language } from '../lib/languages'
import { LanguagePicker, type LanguageChoice } from './LanguagePicker'
import { Badge, Card, CopyButton, Ruby, Skeleton, SpeakButton, ToggleChip } from './ui'

export type DisplayOptions = { furigana: boolean; romaji: boolean }

export function Reading({
  segments,
  options,
  selected,
  onSelect,
  className = 'text-2xl sm:text-3xl',
}: {
  segments: Segment[]
  options: DisplayOptions
  selected?: number
  onSelect: (index: number) => void
  className?: string
}) {
  return (
    <p lang="ja" className={`font-hand leading-relaxed ${className} ${options.furigana ? '' : 'no-furigana'}`}>
      {segments.map((s) =>
        s.type === 'word' ? (
          <button
            key={s.index}
            type="button"
            aria-pressed={selected === s.index}
            onClick={() => onSelect(s.index)}
            className={`mx-px mb-2 inline-flex max-w-full flex-col items-center rounded-lg px-1 align-top transition hover:bg-primary/10 ${selected === s.index ? 'bg-primary/10' : ''}`}
          >
            <span className="max-w-full break-words leading-[1.9]">
              <Ruby parts={s.furigana} />
            </span>
            {options.romaji && (
              <span className="font-sans text-xs font-medium tracking-wide text-muted-foreground">{s.romaji}</span>
            )}
          </button>
        ) : s.type === 'space' ? (
          <span key={s.index} className="whitespace-pre-wrap">{s.surface}</span>
        ) : (
          <span key={s.index} className="inline-block px-0.5 align-top leading-[1.9]">
            {s.surface}
          </span>
        ),
      )}
    </p>
  )
}

export function DisplayControls({ text, options, onOptions }: {
  text: string
  options: DisplayOptions
  onOptions: (o: DisplayOptions) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <ToggleChip label="Furigana" pressed={options.furigana} onChange={(furigana) => onOptions({ ...options, furigana })}>
        <span className="font-hand">ふりがな</span>
      </ToggleChip>
      <ToggleChip label="Romaji" pressed={options.romaji} onChange={(romaji) => onOptions({ ...options, romaji })}>
        romaji
      </ToggleChip>
      <SpeakButton text={text} label="Listen to the text" />
      <CopyButton text={text} label="Copy the text" />
    </div>
  )
}

export function SentenceView({ text, segments, options, onOptions, selected, onSelect }: {
  text: string
  segments: Segment[]
  options: DisplayOptions
  onOptions: (o: DisplayOptions) => void
  selected?: number
  onSelect: (index: number) => void
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="-mt-2 -mr-2 mb-2 flex justify-end">
        <DisplayControls text={text} options={options} onOptions={onOptions} />
      </div>
      <Reading segments={segments} options={options} selected={selected} onSelect={onSelect} />
    </Card>
  )
}

const PROVIDER_URL: Record<Provider, string> = {
  DeepL: 'https://www.deepl.com/',
}

export type Translation =
  | { status: 'loading' }
  | { status: 'done'; value: string; provider: Provider; lines?: string[]; groups?: TranslationGroup[] }
  | { status: 'error'; message: string }

export type LanguageControls = {
  languages: Language[]
  detected?: string
  choice: LanguageChoice
  onChoice: (c: LanguageChoice) => void
  /** The language being translated into, once known. */
  target?: string
}

export function TranslationLinks({ text, target }: { text: string; target?: string }) {
  const q = encodeURIComponent(text)
  const to = target ?? 'EN-US'
  return (
    <div className="flex items-center">
      {[
        ['Google Translate', 'Google', `https://translate.google.com/?sl=ja&tl=${googleCode(to)}&op=translate&text=${q}`],
        ['DeepL', 'DeepL', `https://www.deepl.com/translator#ja/${toTag(to).toLowerCase()}/${q}`],
      ].map(([name, short, href]) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open in ${name}`}
          title={`Open in ${name}`}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          {short}
          <ExternalLink className="size-3" />
        </a>
      ))}
    </div>
  )
}

export function ProviderBadge({ provider }: { provider: Provider }) {
  return (
    <a
      href={PROVIDER_URL[provider]}
      target="_blank"
      rel="noreferrer"
      aria-label={`Translated by ${provider}`}
      title={`Translated by ${provider}`}
      className="whitespace-nowrap align-[3px]"
    >
      <Badge tone={provider === 'DeepL' ? 'green' : 'neutral'}>{provider}</Badge>
    </a>
  )
}

export function TranslationContent({ translation, attribution = true, skeleton = ['95%', '70%'] }: {
  translation?: Translation
  attribution?: boolean
  /** Bar widths shown while the translation is loading. */
  skeleton?: string[]
}) {
  return (
    <div className="min-h-7" aria-live="polite">
      {translation?.status === 'loading' && (
        <div role="status" aria-label="Translating">
          <Skeleton widths={skeleton} className="py-1" />
        </div>
      )}
      {translation?.status === 'done' && (
        <p className="whitespace-pre-line break-words text-lg">
          {translation.value}{attribution && <> <ProviderBadge provider={translation.provider} /></>}
        </p>
      )}
      {translation?.status === 'error' && (
        <p className="text-sm text-primary">Couldn’t translate: {translation.message}.</p>
      )}
    </div>
  )
}

export function TranscriptionRows({ hiragana, romaji }: { hiragana: string; romaji: string }) {
  const rows = [
    { label: 'hiragana', value: hiragana, jp: true },
    { label: 'katakana', value: hiraToKata(hiragana), jp: true },
    { label: 'romaji', value: romaji, jp: false },
  ]
  return (
    <>
      {rows.map((r) => (
        <div key={r.label} className="flex items-start gap-3 px-5 py-3">
          <p className={`min-w-0 flex-1 whitespace-pre-line break-words pt-0.5 text-muted-foreground ${r.jp ? 'font-hand text-lg' : 'text-base'}`}>
            {r.value}
          </p>
          <CopyButton text={r.value} label={`Copy ${r.label}`} />
        </div>
      ))}
    </>
  )
}

export function DictionaryFootnote({ target }: { target?: string }) {
  return target && !target.startsWith('EN') ? (
    <p className="px-5 py-2 text-[11px] text-muted-foreground">
      <span className="text-primary">*</span> Word meanings and kanji are in English.
    </p>
  ) : null
}

export function Transcriptions({ text, hiragana, romaji, translation, language }: {
  text: string
  hiragana: string
  romaji: string
  translation?: Translation
  language: LanguageControls
}) {
  return (
    <Card className="divide-y divide-border">
      <div className="space-y-1.5 px-5 py-3.5">
        <div className="-mx-2.5 flex flex-wrap items-center justify-between gap-1">
          <LanguagePicker {...language} />
          <div className="flex items-center">
            <TranslationLinks text={text} target={language.target} />
            {translation?.status === 'done' && <CopyButton text={translation.value} label="Copy translation" />}
          </div>
        </div>
        <TranslationContent translation={translation} />
      </div>
      <TranscriptionRows hiragana={hiragana} romaji={romaji} />
      <DictionaryFootnote target={language.target} />
    </Card>
  )
}
