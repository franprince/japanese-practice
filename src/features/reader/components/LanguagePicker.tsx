import { Languages } from 'lucide-react'
import { useId, useState } from 'react'
import { ENGLISH, filterLanguages, nativeName, type Language } from '../lib/languages'

export type LanguageChoice = { mode: 'auto' } | { mode: 'en' } | { mode: 'custom'; lang: string }

const isEnglish = (code?: string) => !!code?.startsWith('EN')

/** The language a choice translates into; undefined while the visitor's language is still being detected. */
export function targetOf(choice: LanguageChoice, detected?: string): string | undefined {
  if (choice.mode === 'en') return ENGLISH
  if (choice.mode === 'custom') return choice.lang
  return detected
}

const CHIP = 'inline-flex h-8 items-center rounded-lg px-2.5 text-sm font-medium transition'
const ON = 'bg-primary/10 text-primary'
const OFF = 'text-muted-foreground hover:bg-secondary hover:text-foreground'

/** "*" after a non-English target: word meanings and kanji stay in English (see the card's footnote). */
const Star = () => <sup className="ml-0.5 text-primary">*</sup>

/**
 * [detected language] [English] [type to pick another]. The detected chip is
 * left out when it is English already; suggestions appear once typing starts.
 */
export function LanguagePicker({
  languages,
  detected,
  choice,
  onChoice,
}: {
  languages: Language[]
  detected?: string
  choice: LanguageChoice
  onChoice: (c: LanguageChoice) => void
}) {
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listId = useId()
  const results = editing ? filterLanguages(query, languages) : []
  const englishOn = choice.mode === 'en' || (choice.mode === 'auto' && isEnglish(detected))

  const pick = (l: Language) => {
    onChoice({ mode: 'custom', lang: l.code })
    setEditing(false)
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Translation language">
      {detected && !isEnglish(detected) && (
        <button
          type="button"
          aria-pressed={choice.mode === 'auto'}
          onClick={() => onChoice({ mode: 'auto' })}
          className={`${CHIP} ${choice.mode === 'auto' ? ON : OFF}`}
        >
          {nativeName(detected)}
          {choice.mode === 'auto' && <Star />}
        </button>
      )}
      <button type="button" aria-pressed={englishOn} onClick={() => onChoice({ mode: 'en' })} className={`${CHIP} ${englishOn ? ON : OFF}`}>
        English
      </button>
      <div className="relative">
        <Languages className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          role="combobox"
          aria-label="Other language"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-activedescendant={results.length ? `${listId}-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          value={editing ? query : choice.mode === 'custom' ? nativeName(choice.lang) : ''}
          onFocus={() => {
            setEditing(true)
            setQuery('')
            setActive(0)
          }}
          onBlur={() => setEditing(false)}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              if (results.length) setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length)
            } else if (e.key === 'Enter' && results[active]) {
              e.preventDefault()
              pick(results[active])
            } else if (e.key === 'Escape') {
              e.currentTarget.blur()
            }
          }}
          className={`${CHIP} w-28 pl-7 focus:w-44 focus:bg-secondary focus:text-foreground focus:outline-none ${
            choice.mode === 'custom' && !editing ? ON : 'text-muted-foreground'
          }`}
        />
        {choice.mode === 'custom' && !editing && !isEnglish(choice.lang) && (
          <span className="pointer-events-none absolute top-0.5 right-1.5">
            <Star />
          </span>
        )}
        {results.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            className="absolute top-full left-0 z-20 mt-1 max-h-72 w-60 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg"
          >
            {results.map((l, i) => {
              const own = nativeName(l.code)
              return (
                <li
                  key={l.code}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  // mousedown, not click: the input's blur would close the list first.
                  onMouseDown={(e) => {
                    e.preventDefault()
                    pick(l)
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-baseline justify-between gap-3 rounded-lg px-2.5 py-1.5 text-sm ${
                    i === active ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  <span>{own}</span>
                  {own.toLowerCase() !== l.name.toLowerCase() && <span className="truncate text-xs text-muted-foreground">{l.name}</span>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
