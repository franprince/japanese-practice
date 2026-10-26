// Source indices are inclusive; a translated sentence may span several lyric lines.
export type TranslationGroup = { start: number; end: number; text: string }
