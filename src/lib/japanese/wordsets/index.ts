/** Public runtime dataset API. Internal modules import their direct dependencies. */
export { WordsetAcquisition, wordsetAcquisition } from "./acquisition"
export { ConsentRequired, WordsetError } from "./errors"
export type { FailureKind } from "./errors"
export { normalizeLang, isMobileDevice, getWordsetCacheKey } from "./policy"
export { fetchWordsetMetadata } from "./transport"
export { loadWordSets, readWordsetCache, primeWordsetCache, updateWordset, subscribeWordsetUpdates } from "./loader"
export type { AcquisitionState, DatasetLanguage, LoaderDeps, WordsetEvent, WordsetFetch, WordsetManifest, WordsetMetadata, WordsetStorage, WordSets } from "./contracts"
