/** Stable error identities and classification shared across dataset modules. */
export type FailureKind = "network" | "http" | "aborted" | "parse" | "validation" | "storage"
export class WordsetError extends Error {
  readonly messageKey: `words.downloadError.${FailureKind}`
  constructor(readonly kind: FailureKind, cause?: unknown) {
    super(`Wordset ${kind} failure`, { cause })
    this.messageKey = `words.downloadError.${kind}`
  }
}

export class ConsentRequired extends Error {
  readonly code = "MOBILE_AUTH_REQUIRED"
}
export const wordsetFailure = (error: unknown, kind: FailureKind) =>
  error instanceof WordsetError ? error : new WordsetError(kind, error)
