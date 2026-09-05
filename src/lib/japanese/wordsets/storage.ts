/** IndexedDB operations complete only when the whole transaction is durable. */
import { openDb, STORE_WORDSETS } from "@/lib/core/db"
import type { DatasetLanguage, WordsetStorage } from "./contracts"
import { WordsetError } from "./errors"
import { getWordsetCacheKey } from "./policy"

// A successful request only queues a result; durability requires transaction completion.
export async function cacheTransaction(
  lang: DatasetLanguage, mode: IDBTransactionMode,
  request: (store: IDBObjectStore, key: string) => IDBRequest,
  open: () => Promise<IDBDatabase> = openDb,
  signal?: AbortSignal,
): Promise<unknown> {
  try {
    const db = await open()
    try {
      signal?.throwIfAborted()
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_WORDSETS, mode)
        // A synchronous request failure (for example quota exhaustion) must not
        // leave completion handlers closing over an uninitialized request.
        const req = request(tx.objectStore(STORE_WORDSETS), getWordsetCacheKey(lang))
        const abort = () => tx.abort()
        const cleanup = () => signal?.removeEventListener("abort", abort)
        tx.oncomplete = () => { cleanup(); resolve(req.result) }
        tx.onerror = () => { cleanup(); reject(new WordsetError("storage", tx.error)) }
        tx.onabort = () => { cleanup(); reject(new WordsetError("storage", tx.error)) }
        req.onerror = () => { cleanup(); reject(new WordsetError("storage", req.error)) }
        signal?.addEventListener("abort", abort, { once: true })
      })
    } finally { db.close() }
  } catch (error) {
    throw error instanceof WordsetError ? error : new WordsetError("storage", error)
  }
}
export const indexedDbStorage: WordsetStorage = {
  read: lang => cacheTransaction(lang, "readonly", (store, key) => store.get(key)),
  write: async (lang, data, signal) => { await cacheTransaction(lang, "readwrite", (store, key) => store.put(data, key), openDb, signal) },
  remove: async lang => { await cacheTransaction(lang, "readwrite", (store, key) => store.delete(key)) },
}
