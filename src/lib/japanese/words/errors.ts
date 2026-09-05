export type FailureKind = "network" | "http" | "aborted" | "parse" | "validation" | "storage"
export class WordsetError extends Error {
  readonly messageKey: `words.downloadError.${FailureKind}`
  constructor(readonly kind: FailureKind, cause?: unknown) {
    super(`Wordset ${kind} failure`, { cause })
    this.messageKey = `words.downloadError.${kind}`
  }
}
