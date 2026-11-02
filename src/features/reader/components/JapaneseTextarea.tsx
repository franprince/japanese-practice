'use client'
// A textarea with a romaji input method, like the one in Google Translate: typed romaji becomes kana,
// Space converts the kana to kanji, and ↓/↑ (or Space) step through the other spellings of a phrase.
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type RefObject, type TextareaHTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import { toKana } from 'wanakana'
import type { Phrase } from '../lib/convert'
import { convertible, imeInput, type Pending } from '../lib/ime'
import { convertKana, prepareConversion } from '../lib/tokenizer'

const PAGE = 9
const POPUP_WIDTH = 176
const PICKS_KEY = 'reader-ime-picks'
const MAX_PICKS = 500

type Range = { start: number; end: number }
type Conversion = { start: number; phrases: (Phrase & { chosen: number })[]; active: number }

const spelling = (c: Conversion) => c.phrases.map((p) => p.candidates[p.chosen]).join('')

// The spellings a visitor picked, by phrase reading, so the next conversion offers them first.
function loadPicks(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PICKS_KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function savePicks(c: Conversion) {
  const picks = loadPicks()
  for (const p of c.phrases) {
    const pick = p.candidates[p.chosen]!
    if (p.chosen === 0 && picks[p.reading] === undefined) continue
    delete picks[p.reading]
    picks[p.reading] = pick
  }
  const entries = Object.entries(picks)
  try {
    localStorage.setItem(PICKS_KEY, JSON.stringify(Object.fromEntries(entries.slice(-MAX_PICKS))))
  } catch {
    /* storage unavailable */
  }
}

/** Finishes the romaji still waiting for a letter: a final n becomes ん. */
const finish = (kana: string) => toKana(kana)

export function JapaneseTextarea({
  value,
  onValueChange,
  ime,
  textareaRef,
  className = '',
  ...props
}: {
  value: string
  onValueChange: (value: string) => void
  ime: boolean
  textareaRef: RefObject<HTMLTextAreaElement | null>
  className?: string
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>) {
  const pending = useRef<Pending | undefined>(undefined)
  const caret = useRef<number | undefined>(undefined)
  // The kana typed with the input method and not yet committed, then its conversion.
  const [composition, setComposition] = useState<Range>()
  const [conversion, setConversion] = useState<Conversion>()
  const [converting, setConverting] = useState(false)
  const request = useRef(0)
  const overlay = useRef<HTMLDivElement>(null)
  const marked = useRef<HTMLSpanElement>(null)
  const [popup, setPopup] = useState<{ left: number; top: number }>()

  useEffect(() => {
    if (ime) prepareConversion().catch(() => undefined)
  }, [ime])

  const update = (next: string, at: number) => {
    caret.current = at
    onValueChange(next)
  }

  // A rewritten value sends the caret to the end; put it back where the input method left it.
  useLayoutEffect(() => {
    if (caret.current === undefined) return
    textareaRef.current?.setSelectionRange(caret.current, caret.current)
    caret.current = undefined
  }, [value, textareaRef])

  const commit = () => {
    if (conversion) savePicks(conversion)
    request.current++
    setConversion(undefined)
    setConverting(false)
    setComposition(undefined)
    pending.current = undefined
  }

  // Turning the input method off keeps what was typed and drops the marks.
  const [wasOn, setWasOn] = useState(ime)
  if (wasOn !== ime) {
    setWasOn(ime)
    if (!ime) {
      setConversion(undefined)
      setConverting(false)
      setComposition(undefined)
    }
  }
  const on = useRef(ime)
  useEffect(() => {
    on.current = ime
  }, [ime])

  /** Swaps the shown spellings for those of `next`, keeping the caret after them. */
  const show = (next: Conversion) => {
    if (!conversion) return
    const end = conversion.start + spelling(conversion).length
    setConversion(next)
    update(value.slice(0, next.start) + spelling(next) + value.slice(end), next.start + spelling(next).length)
  }

  const startConversion = () => {
    if (!composition) return
    const kana = finish(value.slice(composition.start, composition.end))
    const base = value.slice(0, composition.start) + kana + value.slice(composition.end)
    const range = { start: composition.start, end: composition.start + kana.length }
    if (base !== value) update(base, range.end)
    setComposition(range)
    pending.current = undefined
    const id = ++request.current
    setConverting(true)
    convertKana(kana).then(
      (phrases) => {
        if (id !== request.current || !on.current || !phrases.length) return
        const picks = loadPicks()
        const c: Conversion = {
          start: range.start,
          active: 0,
          phrases: phrases.map((p) => ({ ...p, chosen: Math.max(0, p.candidates.indexOf(picks[p.reading] ?? '')) })),
        }
        setConverting(false)
        setConversion(c)
        const text = spelling(c)
        caret.current = range.start + text.length
        onValueChange(base.slice(0, range.start) + text + base.slice(range.end))
      },
      () => id === request.current && setConverting(false),
    )
  }

  const choose = (index: number) => {
    if (!conversion) return
    const phrases = conversion.phrases.map((p, i) => (i === conversion.active ? { ...p, chosen: index } : p))
    show({ ...conversion, phrases })
  }

  const step = (by: number) => {
    const phrase = conversion?.phrases[conversion.active]
    if (phrase) choose((phrase.chosen + by + phrase.candidates.length) % phrase.candidates.length)
  }

  /** Back to the kana the conversion was made from. */
  const revert = () => {
    if (!conversion) return
    const kana = conversion.phrases.map((p) => p.reading).join('')
    const end = conversion.start + spelling(conversion).length
    request.current++
    setConversion(undefined)
    setComposition({ start: conversion.start, end: conversion.start + kana.length })
    update(value.slice(0, conversion.start) + kana + value.slice(end), conversion.start + kana.length)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    props.onKeyDown?.(e)
    if (!ime || e.nativeEvent.isComposing || e.ctrlKey || e.metaKey || e.altKey) return
    if (conversion) {
      const handled = (fn: () => void) => {
        e.preventDefault()
        fn()
      }
      const digit = /^[1-9]$/.test(e.key) ? Number(e.key) : 0
      const phrase = conversion.phrases[conversion.active]!
      if ((e.key === ' ' && !e.shiftKey) || e.key === 'ArrowDown') return handled(() => step(1))
      if (e.key === ' ' || e.key === 'ArrowUp') return handled(() => step(-1))
      if (e.key === 'ArrowRight') return handled(() => setConversion({ ...conversion, active: Math.min(conversion.active + 1, conversion.phrases.length - 1) }))
      if (e.key === 'ArrowLeft') return handled(() => setConversion({ ...conversion, active: Math.max(conversion.active - 1, 0) }))
      if (e.key === 'PageDown') return handled(() => choose(Math.min(phrase.candidates.length - 1, (Math.floor(phrase.chosen / PAGE) + 1) * PAGE)))
      if (e.key === 'PageUp') return handled(() => choose(Math.max(0, (Math.floor(phrase.chosen / PAGE) - 1) * PAGE)))
      if (digit) {
        const index = Math.floor(phrase.chosen / PAGE) * PAGE + digit - 1
        if (index < phrase.candidates.length) return handled(() => choose(index))
      }
      if (e.key === 'Enter') return handled(commit)
      if (e.key === 'Escape' || e.key === 'Backspace') return handled(revert)
      // Anything else keeps the conversion and goes on as usual: typing more starts a new phrase.
      if (e.key.length === 1 || e.key === 'Tab' || e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') commit()
      return
    }
    if (converting && e.key === ' ') return e.preventDefault()
    const el = e.currentTarget
    const atEnd = composition && el.selectionStart === composition.end && el.selectionEnd === composition.end
    if (!composition) return
    if (atEnd && e.key === ' ' && !e.shiftKey) {
      e.preventDefault()
      startConversion()
    } else if (atEnd && e.key === 'Enter') {
      // Enter accepts the kana as typed, as with any input method, instead of starting a line.
      e.preventDefault()
      const kana = finish(value.slice(composition.start, composition.end))
      update(value.slice(0, composition.start) + kana + value.slice(composition.end), composition.start + kana.length)
      commit()
    } else if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End' || e.key === 'Escape' || e.key === 'Tab') {
      commit()
    }
  }

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target
    const native = e.nativeEvent as InputEvent
    if (conversion) {
      savePicks(conversion)
      setConversion(undefined)
      setComposition(undefined)
    }
    // Keystrokes only: pastes, deletions and a system input method's own composition pass through as they are.
    if (ime && native.inputType === 'insertText' && !native.isComposing && convertible(native.data) && el.selectionStart === el.selectionEnd) {
      const insertStart = el.selectionEnd - native.data.length
      // Where the converted romaji begins: the waiting letters, if the key continues them.
      const runStart = pending.current?.end === insertStart ? pending.current.start : insertStart
      const next = imeInput(el.value, el.selectionEnd, native.data, pending.current)
      pending.current = next.pending
      const start = !conversion && composition?.end === insertStart ? composition.start : runStart
      setComposition({ start, end: next.caret })
      update(next.value, next.caret)
      return
    }
    pending.current = undefined
    const removed = value.length - el.value.length
    if (!conversion && composition && native.inputType === 'deleteContentBackward' && el.selectionEnd === composition.end - removed && removed > 0) {
      const end = composition.end - removed
      setComposition(end > composition.start ? { start: composition.start, end } : undefined)
    } else {
      setComposition(undefined)
    }
    onValueChange(el.value)
  }

  // The candidate list sits under the phrase being converted, outside the card so it is never clipped.
  const marking = conversion ?? composition
  const open = !!conversion || converting
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const span = marked.current
      if (!span) return
      const rect = span.getClientRects()[0] ?? span.getBoundingClientRect()
      const left = Math.round(Math.max(8, Math.min(rect.left, window.innerWidth - POPUP_WIDTH - 8)))
      const top = Math.round(rect.bottom + 4)
      setPopup((p) => (p && p.left === left && p.top === top ? p : { left, top }))
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, conversion, value])

  const syncScroll = () => {
    if (overlay.current && textareaRef.current) overlay.current.scrollTop = textareaRef.current.scrollTop
  }
  useLayoutEffect(syncScroll)

  const phrase = conversion?.phrases[conversion.active]
  const page = phrase ? Math.floor(phrase.chosen / PAGE) : 0
  const optionId = (i: number) => `ime-candidate-${i}`

  return (
    <div className="relative">
      {marking && (
        <div ref={overlay} aria-hidden="true" className={`${className} ime-overlay`}>
          {value.slice(0, marking.start)}
          {conversion ? (
            conversion.phrases.map((p, i) => (
              <span key={i} ref={i === conversion.active ? marked : undefined} data-ime={i === conversion.active ? 'active' : 'phrase'}>
                {p.candidates[p.chosen]}
              </span>
            ))
          ) : (
            <span ref={marked} data-ime="compose">{value.slice(marking.start, (marking as Range).end)}</span>
          )}
          {value.slice(conversion ? conversion.start + spelling(conversion).length : (marking as Range).end)}
          {'\n'}
        </div>
      )}
      <textarea
        {...props}
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onScroll={syncScroll}
        onMouseDown={(e) => {
          props.onMouseDown?.(e)
          if (conversion || composition) commit()
        }}
        onBlur={(e) => {
          props.onBlur?.(e)
          if (conversion || composition) commit()
        }}
        autoCapitalize={ime ? 'off' : props.autoCapitalize}
        autoComplete={ime ? 'off' : props.autoComplete}
        aria-activedescendant={phrase ? optionId(phrase.chosen) : undefined}
        aria-controls={phrase ? 'ime-candidates' : undefined}
        className={className}
      />
      {open && popup && createPortal(
        <div
          id="ime-candidates"
          role="listbox"
          aria-label="Conversions"
          className="ime-candidates"
          style={{ left: popup.left, top: popup.top }}
          // Clicks in the list must not take the focus from the text.
          onMouseDown={(e) => e.preventDefault()}
        >
          {!phrase ? (
            <p role="status" className="px-2 py-1 text-sm text-muted-foreground">Converting…</p>
          ) : (
            <>
              {phrase.candidates.slice(page * PAGE, page * PAGE + PAGE).map((c, i) => {
                const index = page * PAGE + i
                return (
                  <div
                    key={index}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === phrase.chosen}
                    onClick={() => choose(index)}
                    className="ime-candidate"
                  >
                    <span className="ime-candidate-number">{i + 1}.</span>
                    <span lang="ja">{c}</span>
                  </div>
                )
              })}
              <div className="mt-1 flex items-center justify-between gap-2 border-t border-border px-1 pt-1 text-xs text-muted-foreground">
                <span>{phrase.chosen + 1}/{phrase.candidates.length}</span>
                <span className="flex">
                  <button type="button" tabIndex={-1} aria-label="Previous" onClick={() => step(-1)} className="rounded p-0.5 hover:bg-secondary">
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button type="button" tabIndex={-1} aria-label="Next" onClick={() => step(1)} className="rounded p-0.5 hover:bg-secondary">
                    <ChevronDown className="size-3.5" />
                  </button>
                </span>
              </div>
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
