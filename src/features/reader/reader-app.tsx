'use client'
// Nihongo Rubi's reader, ported from github.com/franprince/nihongo-traductor and restyled for the notebook themes.
import { ClipboardPaste, Clock, ExternalLink, LoaderCircle, Music, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { KanjiDetails, KanjiSheet } from './components/KanjiSheet'
import { targetOf, type LanguageChoice } from './components/LanguagePicker'
import { LyricsView } from './components/LyricsView'
import { SentenceView, Transcriptions, type DisplayOptions, type Translation } from './components/SentenceView'
import { Card, SpeakButton } from './components/ui'
import { EntryCard, SegmentCard } from './components/WordCard'
import { analyze, readingLines, transcriptions, type Segment } from './lib/analyze'
import { getKanji, loadCore, loadRest, searchEnglish, wordCount, type Meta, type Word } from './lib/dictionary'
import { hasJapanese, looksLikeRomaji, romajiToKana } from './lib/japanese'
import { detectLanguages, type Language } from './lib/languages'
import { fetchSpotifyInfo, parseSpotifyLink, type SpotifyInfo, type SpotifyLink } from './lib/spotify'
import { tokenize, warmUp } from './lib/tokenizer'
import { translate, translateLines } from './lib/translate'

type Mode = 'auto' | 'japanese' | 'romaji' | 'english'
const MODES: { id: Mode; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'japanese', label: 'Japanese' },
  { id: 'romaji', label: 'Romaji' },
  { id: 'english', label: 'English' },
]

type SpotifyState =
  | { status: 'loading'; link: SpotifyLink }
  | { status: 'error'; link: SpotifyLink; message: string }
  | ({ status: 'done'; link: SpotifyLink } & SpotifyInfo)

type Result =
  | { kind: 'analysis'; text: string; segments: Segment[] }
  | { kind: 'english'; query: string; words: Word[] }

// `label` is what the chip shows when the value itself would be unreadable (a link).
const EXAMPLES: { value: string; label?: string }[] = [
  { value: '私は昨日、図書館で日本語の本を読んでいました。' },
  { value: 'https://open.spotify.com/track/2hoKhipu6bG2FpYDXLUk7v', label: '花鬘' },
  { value: 'watashi wa sushi ga tabetai desu' },
  { value: 'to remember' },
]

const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(key)
      return v ? (JSON.parse(v) as T) : fallback
    } catch {
      return fallback
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage unavailable */
    }
  },
}

function detect(text: string): Exclude<Mode, 'auto'> {
  if (hasJapanese(text)) return 'japanese'
  return looksLikeRomaji(text) ? 'romaji' : 'english'
}

export default function ReaderApp({ title }: { title: string }) {
  const initial = new URLSearchParams(location.search)
  const [text, setText] = useState(initial.get('q') ?? '')
  const [mode, setMode] = useState<Mode>((initial.get('m') as Mode) || 'auto')
  const [meta, setMeta] = useState<Meta>()
  const [tokenizerReady, setTokenizerReady] = useState(false)
  const [loadError, setLoadError] = useState<string>()
  const [dictVersion, setDictVersion] = useState(0)
  const [rawResult, setResult] = useState<Result>()
  const [rawBusy, setBusy] = useState(false)
  const [kanji, setKanji] = useState<string>()
  const [selected, setSelected] = useState<number>()
  const [options, setOptions] = useState<DisplayOptions>(() => store.get('reader-display', { furigana: true, romaji: true }))
  const [history, setHistory] = useState<string[]>(() => store.get('reader-history', []))
  const [spotify, setSpotify] = useState<SpotifyState>()
  const [translated, setTranslated] = useState<{ source: string; target: string; value: Translation }>()
  const [langs, setLangs] = useState<{ languages: Language[]; detected: string }>()
  const [choice, setChoice] = useState<LanguageChoice>(() => {
    const saved = store.get<LanguageChoice>('reader-translateTo', { mode: 'auto' })
    return saved.mode === 'en' || (saved.mode === 'custom' && typeof saved.lang === 'string') ? saved : { mode: 'auto' }
  })
  const target = targetOf(choice, langs?.detected)
  const run = useRef(0)

  useEffect(() => {
    loadCore()
      .then((m) => {
        setMeta(m)
        setDictVersion((v) => v + 1)
        return loadRest()
      })
      .then((n) => n && setDictVersion((v) => v + 1))
      .catch((e) => setLoadError(String(e.message ?? e)))
    warmUp()
      .then(() => setTokenizerReady(true))
      .catch((e) => setLoadError(String(e.message ?? e)))
  }, [])

  useEffect(() => store.set('reader-display', options), [options])
  // Only the mode is kept for "auto", so the language follows the visitor's country.
  useEffect(() => store.set('reader-translateTo', choice), [choice])
  useEffect(() => {
    detectLanguages().then(setLangs)
  }, [])


  const resolved = mode === 'auto' ? detect(text) : mode
  const input = text.trim()
  const spotifyLink = useMemo(() => parseSpotifyLink(input), [input])
  // In Auto mode, the tab of the detected input type is tinted.
  const detected = mode === 'auto' && input && !spotifyLink ? resolved : undefined

  // A pasted Spotify link is replaced by the title of the song, album or playlist.
  useEffect(() => {
    if (!spotifyLink) return
    const controller = new AbortController()
    fetchSpotifyInfo(spotifyLink, controller.signal).then(
      (info) => {
        setSpotify({ status: 'done', link: spotifyLink, ...info })
        setText(info.title)
      },
      (err) => {
        if (!controller.signal.aborted) setSpotify({ status: 'error', link: spotifyLink, message: err.message })
      },
    )
    return () => controller.abort()
  }, [spotifyLink])

  // Empty input or a pending Spotify link shows no analysis; derived here rather than reset from an effect.
  const result = !input || spotifyLink ? undefined : rawResult
  const busy = rawBusy && !!input && !spotifyLink
  const spotifyView: SpotifyState | undefined =
    spotifyLink && spotify?.link.url !== spotifyLink.url ? { status: 'loading', link: spotifyLink } : spotify

  // Analyze shortly after typing stops.
  useEffect(() => {
    const id = ++run.current
    if (!input || spotifyLink) return
    if (!dictVersion || (resolved !== 'english' && !tokenizerReady)) return
    const timer = setTimeout(async () => {
      setBusy(true)
      try {
        let next: Result
        if (resolved === 'english') {
          next = { kind: 'english', query: input, words: searchEnglish(input) }
        } else {
          const normalized = input.replace(/\r\n?/g, '\n')
          const source = resolved === 'romaji' ? romajiToKana(normalized) : normalized
          next = { kind: 'analysis', text: source, segments: analyze(await tokenize(source)) }
        }
        if (id === run.current) {
          setResult(next)
          setSelected(undefined)
        }
      } finally {
        if (id === run.current) setBusy(false)
      }
    }, 280)
    return () => clearTimeout(timer)
  }, [input, spotifyLink, resolved, dictVersion, tokenizerReady])

  // Translate once the text has settled for a moment; the free quota is small.
  const translateText = result?.kind === 'analysis' ? result.text : undefined
  const lines = useMemo(() => result?.kind === 'analysis' ? readingLines(result.segments) : [], [result])
  const lyrics = lines.filter((line) => line.text.trim()).length > 1
  const translation: Translation | undefined = translated && translated.source === translateText && translated.target === target
    ? translated.value
    : translateText && target ? { status: 'loading' } : undefined
  const lastTranslated = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!translateText || !target) return
    const controller = new AbortController()
    const publish = (value: Translation) => {
      if (controller.signal.aborted) return
      setTranslated({ source: translateText, target, value })
    }
    // Wait only for new text; a language switch on the same text is a click, not typing.
    const delay = translateText === lastTranslated.current ? 0 : 900
    lastTranslated.current = translateText
    const timer = setTimeout(() => {
      const work = lyrics
        ? translateLines(lines.map((line) => line.text), target, controller.signal)
        : translate(translateText, target, controller.signal)
      work.then(
        ({ text, provider, lines, groups }) => publish({ status: 'done', value: text, provider, lines, groups }),
        (err) => publish({ status: 'error', message: err.message }),
      )
    }, delay)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [translateText, target, lines, lyrics])

  // Keep the URL shareable and remember finished queries.
  useEffect(() => {
    const params = new URLSearchParams()
    if (input) params.set('q', input)
    if (mode !== 'auto') params.set('m', mode)
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : location.pathname)
    if (!input || spotifyLink) return
    const timer = setTimeout(() => {
      setHistory((h) => {
        const next = [input, ...h.filter((x) => x !== input)].slice(0, 8)
        store.set('reader-history', next)
        return next
      })
    }, 2500)
    return () => clearTimeout(timer)
  }, [input, spotifyLink, mode])

  const selectWord = useCallback((index: number) => {
    setSelected(index)
    document.getElementById(`word-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const words = useMemo(
    () => (result?.kind === 'analysis' ? result.segments.filter((s) => s.type === 'word') : []),
    [result],
  )
  const loading = !loadError && (!meta || !tokenizerReady)
  const language = { languages: langs?.languages ?? [], detected: langs?.detected, choice, onChoice: setChoice, target }

  // Wide screens keep the kanji in a side panel; narrow ones open it as a sheet.
  const [wide, setWide] = useState(() => matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    const mq = matchMedia('(min-width: 1024px)')
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  // Recomputed every render: getKanji only answers once the dictionary (dictVersion) has loaded.
  const firstKanji = result?.kind === 'analysis' ? [...result.text].find((c) => getKanji(c)) : undefined
  const panelKanji = kanji ?? firstKanji
  const paste = () => navigator.clipboard?.readText().then((value) => value && setText(value), () => undefined)

  return (
    <div className="reader">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p lang="ja" className="font-hand text-lg text-primary">ルビ · 読む</p>
          <h1 className="font-hand text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-[40px]">{title}</h1>
        </div>
        <div className="seg-switch" role="radiogroup" aria-label="Input type">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              data-detected={detected === m.id || undefined}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <Card className="overflow-hidden">
            {loading && (
              <div className="h-0.5 overflow-hidden bg-primary/10" role="progressbar" aria-label="Loading the dictionary">
                <div className="h-full w-1/3 animate-[slide_1.1s_ease-in-out_infinite] bg-primary" />
              </div>
            )}
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="日本語"
                aria-label="Text to read"
                rows={3}
                autoFocus
                spellCheck={false}
                lang="ja"
                className="block min-h-28 w-full resize-y bg-transparent px-6 py-5 pr-12 font-hand text-[22px] leading-relaxed placeholder:text-muted-foreground focus:outline-none sm:text-[26px]"
              />
              {(busy || spotifyView?.status === 'loading') && (
                <LoaderCircle className="absolute top-4 right-4 size-4 animate-spin text-muted-foreground" aria-label="Working" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-border bg-background/50 px-3.5 py-2.5">
              <button type="button" onClick={paste} aria-label="Paste" title="Paste" className="reader-tool-button">
                <ClipboardPaste className="size-[18px]" />
              </button>
              {text && (
                <button type="button" onClick={() => setText('')} aria-label="Clear" title="Clear" className="reader-tool-button">
                  <X className="size-[18px]" />
                </button>
              )}
              {!input && (history.length ? history.map((value) => ({ value, label: undefined })) : EXAMPLES).slice(0, 6).map((ex) => (
                <button
                  key={ex.value}
                  type="button"
                  onClick={() => setText(ex.value)}
                  className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-border bg-card px-3 py-1 font-hand text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  {history.length > 0 && <Clock className="size-3 shrink-0 opacity-60" />}
                  {parseSpotifyLink(ex.value) && <Music className="size-3 shrink-0 text-[#1db954]" />}
                  <span className="truncate">{ex.label ?? ex.value}</span>
                </button>
              ))}
            </div>
          </Card>

          {spotifyView && (spotifyView.status !== 'done' ? spotifyLink?.url === spotifyView.link.url : input === spotifyView.title) && (
            <SpotifySource state={spotifyView} />
          )}

          {loadError && (
            <Card className="border-primary/40 bg-primary/10 p-4 text-sm text-primary">
              The dictionary could not be loaded: {loadError}
            </Card>
          )}

          {result?.kind === 'analysis' && (lyrics ? (
            <LyricsView
              text={result.text}
              lines={lines}
              translation={translation}
              options={options}
              onOptions={setOptions}
              language={language}
              selected={selected}
              onSelect={(index) => setSelected((current) => current === index ? undefined : index)}
              onKanji={setKanji}
            />
          ) : (
            <>
              <SentenceView
                text={result.text}
                segments={result.segments}
                options={options}
                onOptions={setOptions}
                selected={selected}
                onSelect={selectWord}
              />
              <Transcriptions
                text={result.text}
                translation={translation}
                language={language}
                {...transcriptions(result.segments)}
              />
              {words.length > 0 && (
                <section aria-labelledby="reader-words">
                  <div className="mb-3.5 flex items-baseline gap-3.5 border-b border-border pb-2.5">
                    <h2 id="reader-words" className="font-hand text-2xl font-semibold">Words</h2>
                    <span lang="ja" aria-hidden="true" className="font-hand text-[17px] text-primary">単語</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {words.map((s) => (
                      <div key={`${s.index}-${s.surface}`} id={`word-${s.index}`} className="scroll-mt-20">
                        <SegmentCard segment={s} onKanji={setKanji} highlighted={selected === s.index} />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ))}

          {result?.kind === 'english' && (
            <section className="grid gap-4 md:grid-cols-2">
              {result.words.length ? (
                result.words.map((w) => <EntryCard key={w.id} word={w} onKanji={setKanji} />)
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground md:col-span-2">No matches</p>
              )}
            </section>
          )}
        </div>

        {wide && panelKanji && (
          <aside aria-label="Kanji" className="ink-card sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-hand text-lg font-semibold">Kanji</h2>
              <span lang="ja" aria-hidden="true" className="font-hand text-[15px] text-primary">漢字</span>
            </div>
            <KanjiDetails char={panelKanji} onKanji={setKanji} actions={<SpeakButton text={panelKanji} />} />
          </aside>
        )}
      </div>

      <p className="mt-10 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {/* Attribution required by the EDRDG and KanjiVG licences. Dictionary versions are in reader/data/meta.json. */}
        <a
          className="hover:text-foreground"
          href="https://www.edrdg.org/edrdg/licence.html"
          title={meta ? `${wordCount().toLocaleString()} words · ${meta.words} · ${meta.kanji}` : undefined}
        >
          JMdict &amp; KANJIDIC2 © EDRDG, CC BY-SA 4.0
        </a>
        <a className="hover:text-foreground" href="https://kanjivg.tagaini.net/">KanjiVG, CC BY-SA 3.0</a>
        <a className="hover:text-foreground" href="http://www.tanos.co.uk/jlpt/">JLPT lists © Jonathan Waller</a>
        <span>Translations by DeepL, or MyMemory as a fallback</span>
      </p>

      {kanji && !wide && <KanjiSheet char={kanji} onClose={() => setKanji(undefined)} onKanji={setKanji} />}
    </div>
  )

}

function SpotifySource({ state }: { state: SpotifyState }) {
  if (state.status === 'loading') return null
  return (
    <div className="ink-card flex items-center gap-3 px-3 py-2.5 text-sm">
      {state.status === 'done' && state.thumbnail ? (
        // The thumbnail is Spotify's CDN image at its own size; next/image would need a remote pattern for it.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={state.thumbnail}
          alt=""
          onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
          className="size-10 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#1db954]/10 text-[#1db954]">
          <Music className="size-4" />
        </span>
      )}
      <p className={`min-w-0 flex-1 truncate ${state.status === 'error' ? 'text-primary' : 'font-hand font-medium'}`}>
        {state.status === 'error' ? `Spotify: ${state.message}` : state.title}
      </p>
      <a
        href={state.link.url}
        target="_blank"
        rel="noreferrer"
        aria-label="Open in Spotify"
        title="Open in Spotify"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <ExternalLink className="size-4" />
      </a>
    </div>
  )
}
