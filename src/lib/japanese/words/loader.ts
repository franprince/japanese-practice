import type { LoaderDeps, WordSets } from "@/types/api"
import { wordsetAcquisition } from "./acquisition"

export type { LoaderDeps, WordSets } from "@/types/api"
export { normalizeLang, isMobileDevice, getWordsetCacheKey } from "./acquisition"
export const readWordsetCache = (lang: string) => wordsetAcquisition.readCache(lang)
export const primeWordsetCache = async (lang: string, data: WordSets): Promise<void> => {
  await wordsetAcquisition.prime(lang, data)
}
export const loadWordSets = (_deps: LoaderDeps, lang?: string): Promise<WordSets> =>
  wordsetAcquisition.acquire(lang ?? "es")
export const updateWordset = (lang: string) => wordsetAcquisition.update(lang)
export const subscribeWordsetUpdates = (listener: Parameters<typeof wordsetAcquisition.subscribeUpdates>[0]) =>
  wordsetAcquisition.subscribeUpdates(listener)
