import type { WordClass } from './dictionary'

// Short notes for the inflections and helper words that follow a verb or
// adjective. Keyed by the helper's dictionary form.
const AUXILIARY: Record<string, string> = {
  ます: 'polite',
  た: 'past',
  ない: 'negative',
  ぬ: 'negative',
  ん: 'negative',
  たい: 'want to',
  たがる: 'wants to (others)',
  う: 'volitional (let’s)',
  よう: 'volitional (let’s)',
  まい: 'negative volitional',
  らしい: 'apparently',
  そうだ: 'looks like / I hear',
  ようだ: 'seems',
  です: 'polite',
  べし: 'should',
}

const HELPER_VERB: Record<string, string> = {
  れる: 'passive / potential',
  られる: 'passive / potential',
  せる: 'causative',
  させる: 'causative',
  いる: 'ongoing / state',
  ある: 'resulting state',
  しまう: 'completely / regrettably',
  ちゃう: 'completely / regrettably',
  おく: 'in advance',
  みる: 'try doing',
  くる: 'come to',
  いく: 'go on',
  くれる: 'for me',
  くださる: 'please (for me)',
  もらう: 'have someone do',
  いただく: 'have someone do (humble)',
  あげる: 'for someone',
  やる: 'for someone',
  する: 'do (makes a verb)',
}

const HELPER_ADJECTIVE: Record<string, string> = {
  ほしい: 'want someone to',
  やすい: 'easy to',
  にくい: 'hard to',
  づらい: 'hard to',
}

const PARTICLE: Record<string, string> = {
  て: 'te-form (and / then)',
  で: 'te-form (and / then)',
  ば: 'conditional (if)',
  ちゃ: 'te-wa (contracted)',
  じゃ: 'de-wa (contracted)',
}

export type GrammarToken = { surface: string; base: string; pos: string; conjugatedForm: string }

export function grammarNote(t: GrammarToken, afterVerb: boolean): string | undefined {
  switch (t.pos) {
    case '助動詞':
      if (t.base === 'た' && t.conjugatedForm === '仮定形') return 'conditional (-tara)'
      if (t.base === 'ない' && t.conjugatedForm === '仮定形') return 'negative conditional'
      if (t.base === 'だ') return afterVerb ? 'past' : 'copula (is)'
      return AUXILIARY[t.base]
    case '動詞':
      return HELPER_VERB[t.base]
    case '形容詞':
      return HELPER_ADJECTIVE[t.base]
    case '助詞':
      return PARTICLE[t.surface]
  }
}

// IPADIC part-of-speech tags → English labels and word classes.
export function describePos(pos: string, detail: string): { label: string; cls?: WordClass } {
  switch (pos) {
    case '名詞':
      if (detail === '代名詞') return { label: 'pronoun', cls: 'noun' }
      if (detail === '固有名詞') return { label: 'proper noun', cls: 'noun' }
      if (detail === '数') return { label: 'number', cls: 'noun' }
      if (detail === '形容動詞語幹') return { label: 'na-adjective', cls: 'noun' }
      if (detail === '接尾') return { label: 'suffix', cls: 'suffix' }
      if (detail === 'サ変接続') return { label: 'noun (suru verb)', cls: 'noun' }
      return { label: 'noun', cls: 'noun' }
    case '動詞':
      return { label: 'verb', cls: 'verb' }
    case '形容詞':
      return { label: 'i-adjective', cls: 'adjective' }
    case '副詞':
      return { label: 'adverb', cls: 'adverb' }
    case '助詞':
      return { label: 'particle', cls: 'particle' }
    case '助動詞':
      return { label: 'auxiliary verb', cls: 'auxiliary' }
    case '接続詞':
      return { label: 'conjunction', cls: 'conjunction' }
    case '感動詞':
      return { label: 'interjection', cls: 'interjection' }
    case '連体詞':
      return { label: 'pre-noun adjectival', cls: 'prenoun' }
    case '接頭詞':
      return { label: 'prefix', cls: 'prefix' }
    case 'フィラー':
      return { label: 'filler', cls: 'interjection' }
    default:
      return { label: 'other' }
  }
}
