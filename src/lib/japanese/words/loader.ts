import { openDb, STORE_WORDSETS } from "@/lib/core/db"
import type { JapaneseWord } from "@/types/japanese"


import type { LoaderDeps, WordSets } from "@/types/api"


export type { LoaderDeps, WordSets } from "@/types/api"


export const isMobileDevice = () => {
  if (typeof window === "undefined") return false
  if (window.matchMedia?.("(max-width: 768px)").matches) return true
  const ua = navigator.userAgent.toLowerCase()
  return /android|iphone|ipad|ipod|mobile|tablet/.test(ua)
}

export const isWordsetConfirmed = (lang: string) => {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(`wordset-confirmed-${lang}`) === "1"
  } catch {
    return false
  }
}

export const confirmWordset = (lang: string) => {
  if (typeof window === "undefined") return
  localStorage.setItem(`wordset-confirmed-${lang}`, "1")
}



const CACHE_NAMESPACE = "prod"
export const getWordsetCacheKey = (lang: string) => `${CACHE_NAMESPACE}-${lang}`
const cachedPromises: Record<string, Promise<WordSets>> = {}


export const readWordsetCache = async (lang: string): Promise<WordSets | null> => {
  if (typeof indexedDB === "undefined") return null
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_WORDSETS, "readonly")
      const store = tx.objectStore(STORE_WORDSETS)
      const req = store.get(getWordsetCacheKey(lang))
      req.onsuccess = () => resolve(req.result as WordSets)
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    console.warn("IndexedDB read failed", e)
    return null
  }
}

const writeCache = async (lang: string, data: WordSets): Promise<void> => {
  if (typeof indexedDB === "undefined") return
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_WORDSETS, "readwrite")
    const store = tx.objectStore(STORE_WORDSETS)
    store.put(data, getWordsetCacheKey(lang))
  } catch (e) {
    console.warn("IndexedDB write failed", e)
  }
}

export const primeWordsetCache = async (lang: string, data: WordSets): Promise<void> => {
  cachedPromises[lang] = Promise.resolve(data)
  await writeCache(lang, data)
}

const fetchPrebuiltWordset = async (lang: string, currentVersion?: number): Promise<WordSets | "not-modified" | null> => {
  try {
    const headers: Record<string, string> = {};
    if (currentVersion !== undefined) {
      headers["If-None-Match"] = `"${currentVersion}"`;
    }

    const res = await fetch(`/api/wordset?lang=${lang}`, {
      cache: "no-store", 
      headers
    });

    if (res.status === 304) {
      return "not-modified"; 
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch wordset: ${res.statusText}`);
    }

    const data = await res.json();
    return data as WordSets;
  } catch (error) {
    console.error("Error fetching wordset:", error);
    return null;
  }
};

export const normalizeLang = (lang: string | undefined): string => {
  const lower = (lang || "es").toLowerCase()
  if (lower === "ja") return "en"
  if (lower === "en" || lower === "es") return lower
  return "es"
}

export const loadWordSets = (_deps: LoaderDeps, lang?: string): Promise<WordSets> => {
  const datasetLang = normalizeLang(lang)
  if (!cachedPromises[datasetLang]) {
    cachedPromises[datasetLang] = (async () => {
      
      let cached: WordSets | null = null
      try {
        cached = await readWordsetCache(datasetLang)
        console.log(`[Loader] Cache probe for ${datasetLang}:`, cached ? `Found v${cached.version}` : "Miss")
      } catch (e) {
        console.warn("Failed to read cache", e)
      }

      
      const performFetch = async (checkOnly = false): Promise<WordSets | "update-available" | null> => {
        const etagHeader = cached?.version ? `"${cached.version}"` : undefined
        const method = checkOnly ? "HEAD" : "GET"
        console.log(`[Loader] Network request (${method}, If-None-Match: ${etagHeader})`)

        const headers: Record<string, string> = {}
        if (etagHeader) headers["If-None-Match"] = etagHeader

        try {
          const res = await fetch(`/api/wordset?lang=${datasetLang}`, {
            method,
            cache: "no-store",
            headers
          })

          if (res.status === 304) {
            console.log(`[Loader] Network result: 304 Not Modified`)
            if (cached) return cached
            
            const fallback = await fetchPrebuiltWordset(datasetLang)
            return fallback === "not-modified" ? null : fallback
          }

          if (checkOnly) {
            
            
            console.log(`[Loader] Update detected via HEAD`)
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("WORDSET_UPDATE_AVAILABLE", { detail: { lang: datasetLang } }))
            }
            return "update-available"
          }

          if (!res.ok) throw new Error(`Failed to fetch wordset: ${res.statusText}`)

          const data = await res.json() as WordSets
          await writeCache(datasetLang, data)

          
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("WORDSET_UPDATED", { detail: { lang: datasetLang } }))
          }
          return data

        } catch (error) {
          console.error("Error fetching wordset:", error)
          if (cached) return cached
          throw error
        }
      }

      
      if (cached) {
        console.log("[Loader] SWR: Serving cached content immediately")
        
        
        const isMobile = isMobileDevice()
        performFetch(isMobile).catch(err => console.error("[Loader] Background revalidation failed:", err))
        return cached
      }

      
      if (isMobileDevice() && !isWordsetConfirmed(datasetLang)) {
        const error = new Error(`Wordset fetch blocked until user confirms`)
          ; (error as any).code = "MOBILE_AUTH_REQUIRED"
        throw error
      }


      
      console.log("[Loader] Cold start: Waiting for network")
      return performFetch() as Promise<WordSets>
    })().catch((err) => {
      delete cachedPromises[datasetLang]
      throw err
    })
  }
  return cachedPromises[datasetLang]
}

export const updateWordset = async (lang: string) => {
  const datasetLang = normalizeLang(lang)
  try {
    const res = await fetch(`/api/wordset?lang=${datasetLang}`, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch update")
    const data = await res.json()
    await writeCache(datasetLang, data)
    confirmWordset(datasetLang)
    
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("WORDSET_UPDATED", { detail: { lang: datasetLang } }))
    }
    return true
  } catch (e) {
    console.error("Manual update failed", e)
    return false
  }
}
