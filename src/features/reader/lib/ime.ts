import { toKana } from 'wanakana'

/** The romaji typed since the last conversion that is still waiting for more letters ("k", "ky", "n"). */
export type Pending = { start: number; end: number }

export type ImeResult = { value: string; caret: number; pending?: Pending }

// Letters wanakana keeps as romaji while a syllable is incomplete.
const ROMAJI_TAIL = /[a-z']*$/i

/**
 * Applies one keystroke of romaji input, as an input method would: the letters typed so far are
 * turned into kana once they make a syllable (ka → か, kya → きゃ, kka → っか, nn → ん), and an
 * incomplete syllable stays as romaji until the next letter. Capitals give katakana (KA → カ), and
 * . , ? ! - give 。、？！ー.
 *
 * `value` and `caret` are the textarea after the browser inserted `typed`. Only text typed while the
 * input method is on is converted: the romaji before the insertion is joined only if it is the
 * `pending` tail left by the previous keystroke.
 */
export function imeInput(value: string, caret: number, typed: string, pending?: Pending): ImeResult {
  const insertStart = caret - typed.length
  if (insertStart < 0 || value.slice(insertStart, caret) !== typed) return { value, caret }
  const start = pending && pending.end === insertStart && pending.start <= insertStart ? pending.start : insertStart
  const run = value.slice(start, caret)
  const converted = toKana(run, { IMEMode: true })
  const next = value.slice(0, start) + converted + value.slice(caret)
  const nextCaret = start + converted.length
  const tail = ROMAJI_TAIL.exec(converted)![0].length
  return { value: next, caret: nextCaret, pending: tail ? { start: nextCaret - tail, end: nextCaret } : undefined }
}

/** Keystrokes the input method converts: printable ASCII typed or inserted by the keyboard. */
export const convertible = (typed: string | null | undefined): typed is string => !!typed && /^[\x20-\x7e]+$/.test(typed)
