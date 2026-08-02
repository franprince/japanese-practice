# Implementation Plan: Remediate 2026-08-02 architecture review findings

- **Spec:** [spec.md](./spec.md) — approved 2026-08-02 (Option A: trim broken
  themes rather than design five new palettes)
- **Status:** Draft — awaiting approval
- **Branching:** four branches off `develop`, one per phase, each its own PR
  back to `develop`. Land in order — later phases assume earlier ones are
  merged (Phase 3 touches files Phase 2 also deletes-from/edits).

| Phase | Branch | Kind (for `chowa route`) |
| --- | --- | --- |
| 1 — Correctness | `fix/answer-scoring-and-content-bugs` | `debug`, high |
| 2 — Dead code & Ollama gating | `chore/remove-dead-code-and-gate-ollama` | `mechanical` / `architecture` (split, see below) |
| 3 — Performance | `perf/stabilize-keyboard-and-memoize-render` | `refactor`, medium |
| 4 — UX & accessibility | `fix/theme-trim-and-accessibility` | `mechanical` / `refactor` (split, see below) |

Each phase ends with `bunx tsc --noEmit`, `bun run lint`, `bun test src`, and
`bun run build` all green before opening its PR.

---

## Phase 1 — Correctness (`fix/answer-scoring-and-content-bugs`)

### 1.1 Furigana regex excludes ー

**File:** `src/components/ui/furigana-text.tsx:13`

```diff
- const furiganaRegex = /([一-龯ぁ-んァ-ン]+)\s*\[([ぁ-んァ-ン]+)\]/g;
+ const furiganaRegex = /([一-龯ぁ-んァ-ンー]+)\s*\[([ぁ-んァ-ンー]+)\]/g;
```

Both capture groups need ー — group 1 (base word) for words like ミラー, group
2 (reading) for readings like えれべーたー.

**Test:** new case in a `furigana-text.test.tsx` (doesn't exist yet — create
it) rendering `<FuriganaText text="エレベーター[えれべーたー] は あそこ です。" />`
and asserting a `<ruby>` element containing `エレベーター` with an `<rt>` of
`えれべーたー` exists, sourced directly from `curriculum.ts:52`.

### 1.2 Romaji "nn"→"n" collapse over-broad

**File:** `src/lib/japanese/shared/input.ts:73`

Current: `norm = norm.replace(/nn/g, "n")` — collapses every "nn",
including genuine doubled-ん-before-な-row words (あんな→"ana").

The actual ambiguity being worked around is ん directly followed by a vowel
or "y" (requiring an apostrophe in strict Hepburn: `shin'ichi`), which
casual input represents as a doubled "n" instead of an apostrophe. That
case is: `nn` followed by `[aiueoy]`. A genuine doubled consonant (ん + な
row, e.g. あんな = "an"+"na") is `nn` followed by `[aiueoy]` too, syntactically
identical at the character level — the real distinguishing signal isn't the
letters that follow, it's whether the *answer itself* also has the doubled
"nn" or not.

Rather than trying to guess intent from the input string alone, compare
against the answer with the leniency applied **symmetrically only when it
doesn't change the match against the real answer's own "nn" count**:

```diff
- norm = norm.replace(/nn/g, "n")
+ // Collapse "nn" only where it isn't the answer's own doubled sound —
+ // handled at the validateAnswer call site instead, see below.
```

Move the leniency out of `normalizeRomaji` (which has no access to the
answer) and into `validateAnswer`, where both sides are available:

```diff
  const normInput = normalizeRomaji(rawInput)
  const normAnswer = normalizeRomaji(rawAnswer)

  if (normInput === normAnswer) return true

+ // Leniency for the n/nn ambiguity (shin'ichi vs shinnichi): only collapse
+ // "nn" on whichever side has it, and only when the *other* side's "n" in
+ // that position is a single n followed by the same vowel/y — i.e. this
+ // never fires when the answer's "nn" is load-bearing (both sides already
+ // failed the exact-collapse check above with their own "nn" intact).
+ const collapseAmbiguousNN = (s: string) => s.replace(/n(n)(?=[aiueoy])/g, "")
+ if (collapseAmbiguousNN(normInput) === collapseAmbiguousNN(normAnswer)) return true
```

Concretely: for あんな (answer "anna"), `collapseAmbiguousNN("anna")` still
equals `"anna"` unless the *input* also collapses to the same thing — a user
typing "ana" produces `collapseAmbiguousNN("ana")` = `"ana"` (no "nn" to
collapse), which no longer equals `"anna"`, so it's correctly rejected. For
shinkansen/shinnkansen: `collapseAmbiguousNN("shinnkansen")` removes the
second "n" of "nn" only where followed by a/i/u/e/o/y — "nn" here is
followed by "k", a consonant, so **this specific regex wouldn't touch it
either**, meaning the existing test's premise needs rechecking against real
Hepburn rules before locking the regex in.

**Before writing code:** re-derive the exact rule with a short scratch
script against both test cases (あんな must reject "ana", shinkansen must
accept "shinnkansen") — the lookahead pattern above is a starting point, not
guaranteed correct until it passes both. If "shinnkansen" turns out to need
a broader rule than "nn before vowel/y", the fallback is: only collapse
"nn"→"n" in the input when the *answer* does not itself contain "nn" in the
corresponding aligned position (a per-word check using `word.kana` to see
if the ん is followed by な/に/ぬ/ね/の or another ん, vs. followed by a
consonant across a mora boundary).

**Tests to add in `input.test.ts`:**
- `validateAnswer("ana", mockWord("あんな", "anna"))` → `false` (the bug this
  phase fixes).
- `validateAnswer("anna", mockWord("あんな", "anna"))` → `true` (exact match,
  must keep working).
- Existing shinkansen/shinnkansen pair (lines 30-33) must still pass.
- `normalizeRomaji("shinkansen")` still returns `"shinkansen"` unchanged —
  don't regress the existing `normalizeRomaji` unit test if the fix stays
  inside that function instead of moving to `validateAnswer` (implementer's
  call once the exact rule is nailed down).

### 1.3 `getRandomKanji` can infinite-loop

**File:** `src/lib/japanese/kanji/data.ts:140-147`

Replace the reject-and-retry loop with a filter-first approach, mirroring
`getRandomOptions` two functions below it:

```diff
  export function getRandomKanji(list: KanjiEntry[], exclude?: KanjiEntry) {
    if (!list.length) throw new Error("Kanji list is empty")
-   let kanji: KanjiEntry | undefined
-   do {
-     kanji = list[Math.floor(Math.random() * list.length)]
-   } while (exclude && kanji && kanji.char === exclude.char)
-   return kanji!
+   const candidates = exclude ? list.filter(k => k.char !== exclude.char) : list
+   const pool = candidates.length ? candidates : list
+   return pool[Math.floor(Math.random() * pool.length)]!
  }
```

`pool` falls back to the full `list` if excluding leaves nothing (the
single-entry-equals-exclude case) — so the game still returns a kanji
(necessarily repeating it) instead of hanging or throwing.

**Test:** new case calling `getRandomKanji([entry], entry)` and asserting it
returns `entry` (not a hang, not a throw) within the test's normal timeout.

### 1.4 Date-mode toggle regenerates the question instead of just its display

**Files:** `src/hooks/use-date-game.ts`, `src/lib/japanese/dates/dates.ts`,
`src/components/dates/date-game-card.tsx`

Root cause, precisely: `generateNewQuestion` (use-date-game.ts:55-60) has
`showNumbers` in its dependency array and is re-run by the effect at
`use-date-game.ts:62-64` on every `showNumbers` change — regenerating a
brand-new random question instead of just re-rendering the existing one in
a different format. Two independent problems layer on top:

- For `mode === "week_days"`, `generateDateQuestion`'s `useNumbers` branch
  (`dates.ts:213`) doesn't just reformat — it calls a **different
  generator function** (`generateDayQuestion`, a day-of-month reading
  question, unrelated to weekdays) instead of `generateWeekDaysQuestion`.
- `date-game-card.tsx:70` only branches on `mode === "months"` when picking
  `displayNumber` vs `display` — so for `week_days`, the toggle button
  renders (line 79's condition includes `week_days`) but has **no visual
  effect at all**; the only thing that happens today is the hidden
  question-swap bug above.

Fix, in three parts:

**(a) Stop regeneration on toggle** — `use-date-game.ts`:
```diff
  const generateNewQuestion = useCallback(() => {
      if (disableNext) return
-     setQuestion(generateDateQuestion(mode, t, showNumbers))
+     setQuestion(generateDateQuestion(mode, t))
      setUserInput("")
      setFeedback(null)
- }, [mode, disableNext, showNumbers, t, setFeedback])
+ }, [mode, disableNext, t, setFeedback])

  useEffect(() => {
      generateNewQuestion()
- }, [generateNewQuestion, showNumbers])
+ }, [generateNewQuestion])
```

**(b) Drop the broken week_days branch** — `dates.ts:206-215`:
```diff
- export function generateDateQuestion(mode: DateMode, t?: (key: TranslationKey) => string, useNumbers: boolean = false): DateQuestion {
+ export function generateDateQuestion(mode: DateMode, t?: (key: TranslationKey) => string): DateQuestion {
    switch (mode) {
      case "months":
        return generateMonthQuestion(t)
      case "full":
        return generateFullDateQuestion()
      case "week_days":
-       return useNumbers ? generateDayQuestion() : generateWeekDaysQuestion(t)
+       return generateWeekDaysQuestion(t)
    }
  }
```
(`generateDayQuestion` becomes unused by this call site; check whether
anything else calls it before deleting it outright — if nothing does,
remove it too rather than leaving dead code.)

**(c) Make the toggle actually switch the display for week_days** —
`date-game-card.tsx:70-71`:
```diff
- const displayValue = mode === "months" && showNumbers ? question.displayNumber : question.display
- const displayLang = mode === "months" && showNumbers ? undefined : "ja"
+ const usesNumberToggle = mode === "months" || mode === "week_days"
+ const displayValue = usesNumberToggle && showNumbers ? question.displayNumber : question.display
+ const displayLang = usesNumberToggle && showNumbers ? undefined : "ja"
```
`generateWeekDayQuestion` (`dates.ts:183-199`) already populates
`displayNumber` with `dayIndex + 1`, so no changes needed there.

**Tests:** update/add cases in `dates.test.ts` — toggling `showNumbers`
must leave `question` referentially unchanged (same object) while
`displayValue` in the card switches; a `week_days`-mode toggle now shows a
numeral 1-7 instead of the weekday name.

### 1.5 Impossible calendar dates

**File:** `src/lib/japanese/dates/dates.ts:163-180` (`generateFullDateQuestion`)

```diff
+ const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
+
  export function generateFullDateQuestion(): DateQuestion {
    const month = Math.floor(Math.random() * 12) + 1
-   const day = Math.floor(Math.random() * 31) + 1
+   const day = Math.floor(Math.random() * daysInMonth[month - 1]!) + 1
    ...
```
February is conservatively capped at 28 (never generates the leap-year-only
29th) rather than modeling leap years — acceptable, since there's no year
context in this question type to make Feb 29 well-defined anyway.

**Test:** run `generateFullDateQuestion` ~500 times in a loop, parse
`month`/`day` back out of `display`, and assert `day <= daysInMonth[month-1]`
for every draw.

### 1.6 Word-loading race condition

**File:** `src/hooks/use-word-game.ts` (`loadNewWord`, lines 92-167)

Add a monotonic request-id ref so a stale in-flight response can't
overwrite a newer one:

```diff
+ const requestIdRef = useRef(0)
  const loadNewWord = useCallback(async () => {
      if (disableNext) return
+     const requestId = ++requestIdRef.current
      setIsLoading(true)
      let word: JapaneseWord | null = null
      try {
          ... (unchanged word/distractor fetching) ...
      } catch (error: any) {
          console.error("Failed to load word:", error)
      } finally {
+         if (requestId === requestIdRef.current) setIsLoading(false)
      }

+     if (requestId !== requestIdRef.current) return // a newer call already superseded this one
      if (word) {
          setCurrentWord(word)
          ... (unchanged) ...
      } else {
          ... (unchanged) ...
      }
      ...
  }, [mode, filter, suppressFocus, lang, gameType, disableNext, setFeedback])
```

The guard goes right after the try/catch/finally, before any of the
`setCurrentWord`/`setOptions`/`setUserInput` calls that currently run
unconditionally. As defense-in-depth (not strictly required once the guard
above exists, but cheap): `handleKeyDown` (line 247-255) should also skip
calling `loadNewWord()` while `isLoading` is already true, same as it
already skips other actions based on state.

**Test:** mock `getRandomWord` to resolve two overlapping calls out of
order (first call's promise resolves after the second's), call
`loadNewWord()` twice back-to-back, and assert the hook's `currentWord`
ends up matching the *second* call's word, not the first's.

---

## Phase 2 — Dead code & unguarded Ollama tile (`chore/remove-dead-code-and-gate-ollama`)

### 2.1 Remove three dead components

Delete outright (confirmed zero imports repo-wide via `git grep`):
- `src/components/words/words-settings-popover.tsx`
- `src/components/words/mode-selector.tsx`
- `src/components/game/play-mode-controls.tsx`

Re-run `git grep -l "words-settings-popover\|mode-selector\|play-mode-controls"`
after deletion to confirm nothing references them (their own now-orphaned
test files, if any exist, go too — check for
`words-settings-popover.test.tsx` / `mode-selector.test.tsx` style
companions before assuming there are none).

### 2.2 Remove the leftover Vite/Bun scaffold

Delete: `build.ts`, `src/index.html`, `src/index.css`, `src/logo.svg`,
`src/react.svg`. Edit `bunfig.toml` to drop only the `[serve.static]`
section:
```diff
- [serve.static]
- plugins = ["bun-plugin-tailwind"]
- env = "BUN_PUBLIC_*"
-
  [test]
  preload = ["./src/test-utils/dom-setup.ts", "./src/test-utils/setup.ts"]
```
Leave `bun-env.d.ts` alone — it's generic Bun ambient typing still relevant
to `scripts/*.ts`, not part of the dead scaffold.

### 2.3 Remove orphaned hook stub

Delete `src/hooks/use-game-page.ts` (currently `export {}`, confirmed zero
imports).

### 2.4 Gate the Ollama practice tile behind an env flag

New file `src/lib/core/feature-flags.ts`:
```ts
export const isOllamaPracticeEnabled = process.env.NEXT_PUBLIC_ENABLE_OLLAMA_PRACTICE === "true"
```
(`NEXT_PUBLIC_` prefix required — `game-registry.ts`'s consumer,
`app/page.tsx`, is a client component, so the flag must be inlined at build
time rather than read server-side only.)

**`src/lib/core/game-registry.ts`:** filter the ollama entry out of `GAMES`
unless enabled:
```diff
+ import { isOllamaPracticeEnabled } from "./feature-flags"
+
- export const GAMES: GameDefinition[] = [
+ const ALL_GAMES: GameDefinition[] = [
    ... romaji, numbers, kanji, dates entries unchanged ...,
    {
      id: 'ollama',
      ...
    },
  ]
+
+ export const GAMES: GameDefinition[] = ALL_GAMES.filter(
+   g => g.id !== "ollama" || isOllamaPracticeEnabled
+ )
```

**`app/practice/ollama/page.tsx`:** guard the route itself so direct
navigation degrades gracefully instead of attempting a doomed
sqlite/Ollama call:
```diff
+ import { isOllamaPracticeEnabled } from "@/lib/core/feature-flags"
+
  export default function OllamaPracticePage() {
+   if (!isOllamaPracticeEnabled) {
+     return (
+       <div className="container mx-auto py-16 px-4 max-w-lg text-center space-y-3">
+         <h1 className="text-2xl font-bold">Not available</h1>
+         <p className="text-muted-foreground">This experimental practice mode isn't enabled in this environment.</p>
+       </div>
+     )
+   }
    const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([1])
    ...
```
Default (flag unset) means the tile is hidden and the route shows the
"not available" message — matches the decision to treat this as
experimental without resolving the Docker-vs-Vercel question in this pass.

**Test:** a `game-registry.test.ts` case (extending the existing one)
asserting `GAMES` excludes the `ollama` entry when the env var is unset,
and includes it when set to `"true"`.

### 2.5 Consolidate the triplicated Fisher-Yates shuffle

All three existing implementations are algorithmically equivalent
(in-place-then-copy, returns a new array, doesn't mutate the input) — safe
to point every call site at `src/lib/core/random.ts`'s `shuffleArray`.

**`src/lib/japanese/kanji/data.ts`:**
```diff
+ import { shuffleArray } from "@/lib/core/random"
- const shuffle = <T,>(arr: T[]) => { ... }
  ...
  export function getRandomOptions(...) {
    ...
-   return shuffle(options)
+   return shuffleArray(options)
  }
```

**`src/lib/japanese/words/words.ts`** (`clampWordsetForMobile`, lines 44-54):
```diff
+ import { shuffleArray } from "@/lib/core/random"
  const clampWordsetForMobile = (words: JapaneseWord[]) => {
    if (!isMobileDevice() || words.length <= MOBILE_WORDSET_MAX) return words
-   const shuffled = [...words]
-   for (let i = shuffled.length - 1; i > 0; i -= 1) { ... }
-   return shuffled.slice(0, MOBILE_WORDSET_MAX)
+   return shuffleArray(words).slice(0, MOBILE_WORDSET_MAX)
  }
```

**`src/hooks/use-word-game.ts:141`:**
```diff
+ import { shuffleArray } from "@/lib/core/random"
- const allOptions = [word.romaji, ...distractors].sort(() => Math.random() - 0.5)
+ const allOptions = shuffleArray([word.romaji, ...distractors])
```

**Test:** existing `game-registry.test.ts`/`kanji` tests should be
unaffected; add nothing new here beyond confirming `bun test src` still
passes — this is a pure refactor with no behavior change.

---

## Phase 3 — Performance (`perf/stabilize-keyboard-and-memoize-render`)

### 3.1 `useKeyboardNavigation` re-subscribes on every render

**File:** `src/hooks/use-keyboard-navigation.ts` — fix once, centrally,
instead of memoizing the handlers object at each of the three call sites
(some of those handlers — e.g. date's `handleSubmit` — are themselves
recreated on every keystroke via their own `userInput`/`userAnswer`
dependency, so memoizing only the wrapping object wouldn't fully solve it).
Use the standard "latest ref" pattern so the `addEventListener` effect
depends only on `enabled`:

```diff
  export function useKeyboardNavigation(handlers: KeyboardHandlers, enabled = true) {
+     const handlersRef = useRef(handlers)
+     useEffect(() => {
+         handlersRef.current = handlers
+     })
+
      useEffect(() => {
          if (!enabled) return
          const handleKeyDown = (e: KeyboardEvent) => {
-             if (e.key === "Enter" && handlers.onEnter) {
+             if (e.key === "Enter" && handlersRef.current.onEnter) {
                  e.preventDefault()
-                 handlers.onEnter()
+                 handlersRef.current.onEnter()
              }
-             if (e.key === "Escape" && handlers.onEscape) {
-                 handlers.onEscape()
+             if (e.key === "Escape" && handlersRef.current.onEscape) {
+                 handlersRef.current.onEscape()
              }
-             if (e.key === "Backspace" && handlers.onBackspace) {
-                 handlers.onBackspace()
+             if (e.key === "Backspace" && handlersRef.current.onBackspace) {
+                 handlersRef.current.onBackspace()
              }
          }
          window.addEventListener("keydown", handleKeyDown)
          return () => window.removeEventListener("keydown", handleKeyDown)
-     }, [handlers, enabled])
+     }, [enabled])
  }
```
No changes needed at any of the three call sites (`use-date-game.ts`,
`use-kanji-game.ts`, `use-number-game.ts`) for this part.

**Test:** a hook test (new `use-keyboard-navigation.test.ts`) that renders
a harness component, forces several re-renders with changing inline
handler objects, and asserts `addEventListener`/`removeEventListener` (spy
on `window`) are each called exactly once across those re-renders — only
toggling `enabled` should cause a re-subscribe.

### 3.2 Global listener stays active while a settings popover is open

Threads a new `suppressKeyboard` concern from each page, through the
popover's now-observable open state, into the corresponding game hook.

**`src/components/game/game-settings-popover.tsx`** — make `open` observable:
```diff
  interface GameSettingsPopoverProps {
    playMode: PlayMode
    onSelectMode: (mode: PlayMode) => void
    targetCount: number
    onSelectCount: (count: number) => void
    remainingQuestions: number
+   onOpenChange?: (open: boolean) => void
  }

- export function GameSettingsPopover({ playMode, onSelectMode, targetCount, onSelectCount, remainingQuestions }: GameSettingsPopoverProps) {
+ export function GameSettingsPopover({ playMode, onSelectMode, targetCount, onSelectCount, remainingQuestions, onOpenChange }: GameSettingsPopoverProps) {
    const { t } = useI18n()
    const [open, setOpen] = useState(false)
+
+   const updateOpen = (next: boolean) => {
+     setOpen(next)
+     onOpenChange?.(next)
+   }
```
Replace the three `setOpen(...)` call sites (toggle button `onClick`,
backdrop `onClick`, and the internal Escape handler) with `updateOpen(...)`
equivalents.

**Each game hook** gains an optional `suppressKeyboard` prop folded into
the `enabled` argument passed to `useKeyboardNavigation`:

- `use-date-game.ts` / `use-kanji-game.ts` (both currently pass `true`):
  ```diff
  - useKeyboardNavigation({...}, true)
  + useKeyboardNavigation({...}, !suppressKeyboard)
  ```
- `use-number-game.ts` (currently passes `!disableNext`):
  ```diff
  - useKeyboardNavigation({...}, !disableNext)
  + useKeyboardNavigation({...}, !disableNext && !suppressKeyboard)
  ```
  Add `suppressKeyboard?: boolean` to each hook's `Props` interface,
  defaulting to `false`.

**Each game card** (`date-game-card.tsx`, `kanji-game-card.tsx`,
`number-game-card.tsx`) accepts and forwards a new `suppressKeyboard?:
boolean` prop into its hook call.

**Each page** (`app/dates/page.tsx`, `app/kanji/page.tsx`,
`app/numbers/page.tsx`) adds local state and wires it through:
```diff
+ const [settingsOpen, setSettingsOpen] = useState(false)
  ...
  <GameSettingsPopover
    ...
+   onOpenChange={setSettingsOpen}
  />
  ...
  <DateGameCard  {/* or KanjiGameCard / NumberGameCard */}
    ...
+   suppressKeyboard={settingsOpen}
  />
```

**Test:** for one representative game (numbers), a test that opens the
settings popover, presses Backspace, and asserts `userAnswer` is
unchanged (currently it would be cleared).

### 3.3 `quiz-engine.tsx` recomputes on every render

**File:** `src/components/quiz/quiz-engine.tsx`

Both the question-rendering IIFE (~line 152) and the explanation IIFE
(~line 260) independently derive `correctOption`/`correctParts` from
`currentQuestion.options[currentQuestion.answerIndex]`. Hoist once per
question:
```diff
+ const correctOption = currentQuestion.options[currentQuestion.answerIndex] ?? ""
+ const correctParts = useMemo(
+   () => correctOption.split(/[,，]\s*/),
+   [correctOption]
+ )
```
placed after `currentQuestion` is resolved, then reference `correctOption`/
`correctParts` in both places instead of recomputing them locally in each
IIFE. (`useMemo` needs `import { useMemo } from "react"` added to the
existing `React, { useState }` import.)

**Test:** existing `quiz-engine.test.tsx` assertions must keep passing
unmodified — this is a pure internal refactor, no behavior change.

### 3.4 `FuriganaText` re-parses every render

**File:** `src/components/ui/furigana-text.tsx`

```diff
- export function FuriganaText({ text, className = "" }: FuriganaTextProps) {
-   const furiganaRegex = ...
-   const parts = [];
-   ... (build parts) ...
-   return <span className={className} lang="ja">{parts}</span>
- }
+ export function FuriganaText({ text, className = "" }: FuriganaTextProps) {
+   const parts = useMemo(() => {
+     const furiganaRegex = /([一-龯ぁ-んァ-ンー]+)\s*\[([ぁ-んァ-ンー]+)\]/g
+     const built = []
+     ... (same building logic, pushed into `built`) ...
+     return built
+   }, [text])
+   return <span className={className} lang="ja">{parts}</span>
+ }
```
(Needs `import { useMemo } from "react"` — the file currently only imports
`React` as a whole; either add the named import or use `React.useMemo`.)

### 3.5 Debug logging in the wordset loader hot path

**File:** `src/lib/japanese/words/loader.ts` (6 call sites: lines 116, 125,
138, 148, 175, 192)

Gate behind a dev check rather than deleting outright (useful when
debugging locally):
```diff
+ const debugLog = (...args: unknown[]) => {
+   if (process.env.NODE_ENV !== "production") console.log(...args)
+ }
```
Replace each `console.log("[Loader] ...")` call with `debugLog("[Loader]
...")`.

---

## Phase 4 — UX & accessibility (`fix/theme-trim-and-accessibility`)

### 4.1 Trim the theme system to the three working themes

**`src/lib/theme/theme-context.tsx:23`:**
```diff
- if (saved && ["default", "sakura", "ocean", "forest", "sunset", "daylight", "lavender", "mint"].includes(saved)) {
+ if (saved && ["default", "sakura", "ocean"].includes(saved)) {
    setTheme(saved)
  }
```
(Falls through to the existing `"default"` initial state for any stale
`localStorage` value outside the three — no crash, per the spec's edge
case.)

**`src/types/ui.ts`** — narrow the `Theme` type to
`"default" | "sakura" | "ocean"` (check current definition first; likely a
union type listing all eight).

**`src/components/theme-switcher.tsx`:**
```diff
  const darkThemes = [
    { value: "default", ... },
    { value: "sakura", ... },
    { value: "ocean", ... },
-   { value: "forest", ... },
-   { value: "sunset", ... },
  ] as const

- const lightThemes = [ ... ] as const
- const allThemes = [...darkThemes, ...lightThemes]
+ const allThemes = darkThemes
```
Remove the "Light" section header block (lines ~85-108) and the
`lightThemes.map(...)` render entirely, since there's nothing left under
it. The remaining single group's "Dark" header becomes redundant with only
one group — consider dropping the `Moon`-icon header too so the dropdown
just lists three flat options (implementer's call; either is fine, just
don't leave an empty "Light" section).

**`src/components/game-selector-card.tsx`:** delete the `LIGHT_THEMES`
constant and the entire `isLightTheme` branch (lines 15, 19, 21-58),
keeping only the dark-gradient render path that currently runs in the
`else` case — it becomes the only path.

**Locale files** (`src/locales/en.json`, `es.json`, `ja.json`): remove now-
unused keys `themes.forest.*`, `themes.sunset.*`, `themes.daylight.*`,
`themes.lavender.*`, `themes.mint.*`, `themes.light.title`. Keep
`themes.dark.title` only if the dropdown keeps a header (see above).

**Test:** update/add a `theme-switcher.test.tsx`-style check (or extend
existing coverage if any) asserting exactly 3 options render.

### 4.2 Missing ARIA state on toggle/segmented controls

Add `aria-pressed={isActive}` (buttons acting as toggles) or
`aria-selected`/`role="radiogroup"` + `role="radio"` (mutually-exclusive
option groups) to the active-state buttons in:
- `src/components/game/game-settings-popover.tsx` (play-mode toggle,
  target-count buttons)
- `src/components/kanji/kanji-difficulty-selector.tsx`
- `src/components/numbers/difficulty-selector.tsx`
- `src/components/dates/date-mode-selector.tsx`
- `src/components/words/words-settings-overlay.tsx` (mode grid, play-mode
  toggle, group-selection toggles — the largest of the five)

Pattern per button (mechanical, repeat at each site): wherever a
conditional class like `isActive ? "bg-primary text-primary-foreground" :
"..."` already exists, add `aria-pressed={isActive}` alongside it. Also add
`aria-expanded`/`aria-haspopup="menu"` to `game-settings-popover.tsx`'s
trigger button, matching the pattern `theme-switcher.tsx:50-51` already
uses correctly.

**Test:** for each updated selector, a testing-library assertion that the
active option's button exposes `aria-pressed="true"` and inactive ones
`"false"`.

### 4.3 Hardcoded feedback colors bypass theme tokens

Swap raw Tailwind red/green utilities for the existing `success`/
`destructive` tokens (already correctly used one file over in
`game-card-container.tsx`, and already correctly used in
`game-feedback-section.tsx` — use those two as the reference pattern):

**`src/components/game/primitives/result-display.tsx`** (lines 32, 40, 42,
44, 61):
```diff
- isCorrect ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30",
+ isCorrect ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30",
  ...
- {isCorrect ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
+ {isCorrect ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-destructive" />}
  ...
- <span className={cn("font-medium", isCorrect ? "text-green-500" : "text-red-500")}>
+ <span className={cn("font-medium", isCorrect ? "text-success" : "text-destructive")}>
  ...
- <span className={cn("font-bold", isCorrect ? "text-green-500" : "text-red-500")}>
+ <span className={cn("font-bold", isCorrect ? "text-success" : "text-destructive")}>
```

**`src/components/kanji/kanji-option-card.tsx`** (lines 66-67):
```diff
- isRevealed && isCorrect === true && "border-green-500 bg-green-500/10",
- isRevealed && isCorrect === false && isSelected && "border-red-500 bg-red-500/10",
+ isRevealed && isCorrect === true && "border-success bg-success/10",
+ isRevealed && isCorrect === false && isSelected && "border-destructive bg-destructive/10",
```
Also add a check/x icon here to match `words`' `FeedbackIcon` pattern
(currently color-only feedback on this card) — small addition, same
component.

**`src/components/game/session-summary-card.tsx:64`:**
```diff
- <span className={accuracy >= 80 ? "text-green-500" : ""}>{accuracy}% {accuracyLabel}</span>
+ <span className={accuracy >= 80 ? "text-success" : ""}>{accuracy}% {accuracyLabel}</span>
```

**`src/components/quiz/quiz-engine.tsx`** — every raw red/green utility in
the file (option button states ~lines 226-238, inline `<select>` states
~lines 191-197, results-explanation panel ~lines 269-274, badge ~271):
map each to the `success`/`destructive` token equivalent, preserving
opacity suffixes (`/10`, `/40`, `/50`, etc.) and adding `-foreground`
variants where a colored background needs readable text on top (e.g. the
`bg-green-600 text-white` badge → `bg-success text-success-foreground`).

**Test:** `git grep -n "bg-green-\|text-green-\|bg-red-\|text-red-\|border-green-\|border-red-"`
across these four files returns nothing after the change (matches
elsewhere, if any remain out of this list, are out of scope).

### 4.4 Words game missing explicit correct/incorrect text label

**File:** `src/components/words/game-feedback-section.tsx`

Add a visible "Correct"/"Incorrect" label using the same `t("correct")`/
`t("incorrect")` keys `result-display.tsx` already uses, near the existing
feedback glow header (~line 36-41), so the words game matches the other
three games' icon+text+color pattern instead of icon+color only.

### 4.5 Mobile wordset download modal has no keyboard handling

**File:** `src/components/words/mobile-wordset-modal.tsx`

Copy the Escape + body-scroll-lock pattern already implemented correctly
in the (soon-to-be-deleted-but-still-present-until-Phase-2-merges, so
reference it now while it exists, or pull the pattern from git history
after Phase 2 lands) `words-settings-popover.tsx:32-47`:
```diff
+ useEffect(() => {
+   if (!open) return
+   const prevOverflow = document.body.style.overflow
+   document.body.style.overflow = "hidden"
+   const handleKeyDown = (e: KeyboardEvent) => {
+     if (e.key === "Escape" && !cancelDisabled) onCancel()
+   }
+   window.addEventListener("keydown", handleKeyDown)
+   return () => {
+     document.body.style.overflow = prevOverflow
+     window.removeEventListener("keydown", handleKeyDown)
+   }
+ }, [open, cancelDisabled, onCancel])
```
Escape maps to `onCancel` (declining the download), gated on
`!cancelDisabled` to match the Cancel button's own disabled state (e.g.
mid-download).

### 4.6 "Play Again" doesn't restart in place

**Files:** `src/components/quiz/quiz-engine.tsx`, its consumer
`app/practice/ollama/page.tsx`

Add a distinct `onPlayAgain?: () => void` prop to `QuizEngine`, separate
from `onRestart`. On the results screen, "Play Again" calls `onPlayAgain`
(resets `currentIndex`/`score`/`isFinished`/etc. back to the start of the
*same* `questions` array — can be done internally in `QuizEngine` itself
without a parent callback if the parent doesn't need to know, i.e. just
reset local state rather than requiring a new prop at all: simplest fix is
an internal `handlePlayAgain` that resets `currentIndex`, `score`,
`isFinished`, `showExplanation`, `userAnswers`, `selectedOptionIndex` back
to their initial values, keeping the same `questions` prop). "Back to
Settings" keeps calling `onRestart` as today. Only add the new prop if
internal-only reset isn't sufficient (it should be, since `questions` is
still in scope as a prop) — prefer the smaller, prop-free fix.

### 4.7 Missing `lang="ja"` on kanji reading

**File:** `src/components/game/primitives/result-display.tsx:55`

```diff
- {romaji && <p className="text-xs text-muted-foreground">{romaji}</p>}
+ {romaji && <p lang="ja" className="text-xs text-muted-foreground">{romaji}</p>}
```
Verify this doesn't regress the *other* callers of `ResultDisplay` that
pass actual romanized text (not kana) into the `romaji` prop (e.g.
`number-game-card.tsx` passes `correctAnswerRomaji`, genuinely Latin-script
— check whether `lang="ja"` on Latin text there is harmless (it is; `lang`
only affects font/voice hints, not validation) before locking this in as a
blanket change to the primitive rather than a per-caller fix.

---

## Overall test/verification plan

Run after every phase, not just at the end:
```
bunx tsc --noEmit
bun run lint
bun test src
bun run build
```
Phase 1 and 3 add new unit tests as listed inline above. Phase 2 and 4 are
mostly deletions/mechanical substitutions verified by the existing suite
plus targeted `git grep` checks (also listed inline). No e2e
(`test:e2e`) changes are anticipated, but a manual click-through of each
affected page (words/kanji/numbers/dates settings popover, theme
switcher, quiz results screen) before opening each phase's PR is cheap
insurance given Playwright isn't run in this pass.
