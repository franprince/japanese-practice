import type { IpadicFeatures } from 'kuromoji'

// kuromoji runs in a worker: building its dictionary takes a moment and
// would otherwise block typing.
let worker: Worker | undefined
let nextId = 0
const pending = new Map<number, { resolve: (t: IpadicFeatures[]) => void; reject: (e: Error) => void }>()

function send(text?: string): Promise<IpadicFeatures[]> {
  if (!worker) {
    worker = new Worker(new URL('./tokenizer.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<{ id: number; tokens?: IpadicFeatures[]; error?: string }>) => {
      const p = pending.get(e.data.id)
      pending.delete(e.data.id)
      if (e.data.error) p?.reject(new Error(e.data.error))
      else p?.resolve(e.data.tokens ?? [])
    }
  }
  const id = nextId++
  const dicPath = new URL('/reader/dict/', location.href).href
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    worker!.postMessage({ id, dicPath, text })
  })
}

/** Starts loading the tokenizer dictionary ahead of the first request. */
export const warmUp = () => send().then(() => undefined)
export const tokenize = (text: string) => send(text)
