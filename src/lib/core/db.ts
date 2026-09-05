export const DB_NAME = "kana-words"
export const DB_VERSION = 3
export const STORE_KANJI = "kanjiData"
export const STORE_WORDSETS = "wordSets"

export const openDb = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
            reject(new Error("IndexedDB not available"))
            return
        }
        const req = indexedDB.open(DB_NAME, DB_VERSION)
        let blocked = false
        req.onblocked = () => {
            blocked = true
            reject(new Error("IndexedDB upgrade blocked by another tab"))
        }
        req.onupgradeneeded = () => {
            const db = req.result

            
            if (!db.objectStoreNames.contains(STORE_KANJI)) {
                db.createObjectStore(STORE_KANJI)
            }

            
            if (!db.objectStoreNames.contains(STORE_WORDSETS)) {
                db.createObjectStore(STORE_WORDSETS)
            }
        }
        req.onsuccess = () => {
            if (blocked) { req.result.close(); return }
            req.result.onversionchange = () => req.result.close()
            resolve(req.result)
        }
        req.onerror = () => reject(req.error)
    })
