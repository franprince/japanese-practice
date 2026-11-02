import type { IpadicFeatures } from 'kuromoji'
import type { Phrase } from './convert'

// kuromoji runs in a worker: building its dictionary takes a moment and
// would otherwise block typing. The worker also converts kana to kanji for the input method.
type Reply = { id: number; tokens?: IpadicFeatures[]; phrases?: Phrase[]; error?: string }
let worker: Worker | undefined
let nextId = 0
const pending = new Map<number, { resolve: (reply: Reply) => void; reject: (e: Error) => void }>()

function send(message: { text?: string; convert?: string; commonUrl?: string }): Promise<Reply> {
  if (!worker) {
    worker = new Worker(new URL('./tokenizer.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<Reply>) => {
      const p = pending.get(e.data.id)
      pending.delete(e.data.id)
      if (e.data.error) p?.reject(new Error(e.data.error))
      else p?.resolve(e.data)
    }
  }
  const id = nextId++
  const dicPath = new URL('/reader/dict/', location.href).href
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    worker!.postMessage({ id, dicPath, ...message })
  })
}

const commonUrl = () => new URL('/reader/data/words-common.json', location.href).href

/** Starts loading the tokenizer dictionary ahead of the first request. */
export const warmUp = () => send({}).then(() => undefined)
export const tokenize = (text: string) => send({ text }).then((r) => r.tokens ?? [])
/** Starts building the kana-to-kanji index ahead of the first conversion. */
export const prepareConversion = () => send({ commonUrl: commonUrl() }).then(() => undefined)
/** Converts kana into phrases with their candidate spellings. */
export const convertKana = (kana: string) => send({ convert: kana, commonUrl: commonUrl() }).then((r) => r.phrases ?? [])
