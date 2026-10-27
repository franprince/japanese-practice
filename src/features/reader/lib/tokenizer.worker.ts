import kuromoji, { type IpadicFeatures, type Tokenizer } from 'kuromoji'

let tokenizer: Promise<Tokenizer<IpadicFeatures>> | undefined

function build(dicPath: string) {
  tokenizer ??= new Promise((resolve, reject) =>
    kuromoji.builder({ dicPath }).build((err, t) => (err ? reject(err) : resolve(t))),
  )
  return tokenizer
}

self.onmessage = async (e: MessageEvent<{ id: number; dicPath: string; text?: string }>) => {
  const { id, dicPath, text } = e.data
  try {
    const t = await build(dicPath)
    self.postMessage({ id, tokens: text === undefined ? [] : t.tokenize(text) })
  } catch (err) {
    tokenizer = undefined
    self.postMessage({ id, error: String(err) })
  }
}
