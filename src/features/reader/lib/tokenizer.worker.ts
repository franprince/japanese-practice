import kuromoji, { type IpadicFeatures, type Tokenizer } from 'kuromoji'
import { convert, type Lexicon } from './convert'
import type { RawWord } from './dictionary'
import { commonWords, kuromojiLexicon } from './lexicon'

let tokenizer: Promise<Tokenizer<IpadicFeatures>> | undefined
let lexicon: Promise<Lexicon> | undefined

function build(dicPath: string) {
  tokenizer ??= new Promise((resolve, reject) =>
    kuromoji.builder({ dicPath }).build((err, t) => (err ? reject(err) : resolve(t))),
  )
  return tokenizer
}

// The conversion index takes a couple of seconds, so it is only built once the input method is used.
function buildLexicon(dicPath: string, commonUrl: string) {
  lexicon ??= Promise.all([
    build(dicPath),
    fetch(commonUrl).then((res) => (res.ok ? (res.json() as Promise<RawWord[]>) : [])),
  ]).then(([t, common]) => kuromojiLexicon(t, commonWords(common)))
  return lexicon
}

type Request = { id: number; dicPath: string; text?: string; convert?: string; commonUrl?: string }

self.onmessage = async (e: MessageEvent<Request>) => {
  const { id, dicPath, text, commonUrl } = e.data
  try {
    if (commonUrl !== undefined) {
      const lex = await buildLexicon(dicPath, commonUrl)
      self.postMessage({ id, phrases: e.data.convert ? convert(e.data.convert, lex) : [] })
      return
    }
    const t = await build(dicPath)
    self.postMessage({ id, tokens: text === undefined ? [] : t.tokenize(text) })
  } catch (err) {
    tokenizer = undefined
    lexicon = undefined
    self.postMessage({ id, error: String(err) })
  }
}
