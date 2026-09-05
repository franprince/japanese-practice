# Reliable Wordset Acquisition

## Status

Implemented and verified locally — continued under the user's 2026-09-05
backlog instruction. Pull request and merge are pending.

## Context

The words game obtains large, language-specific datasets through a path that
currently mixes device policy, HTTP transport, streamed progress, runtime
parsing, IndexedDB persistence, an in-memory promise cache, local-storage
confirmation, browser events, and modal state.

Those responsibilities do not currently share one success contract. In
particular, the mobile flow can mark a language as confirmed and switch to the
words game after a failed request, cache writes resolve before their IndexedDB
transaction commits, malformed datasets are trusted, and several failures are
silently ignored. Background revalidation also communicates through untyped
window events, so callers cannot reliably distinguish success from failure.

This change defines a single observable lifecycle and makes a durable,
validated cache entry the source of truth for downloaded wordsets.

## Goals

1. Represent acquisition with a typed lifecycle: `idle`, `checking-cache`,
   `awaiting-consent`, `downloading`, `persisting`, `ready`, and `failed`.
2. Give cache reads, downloads, validation, persistence, revalidation, and
   retries explicit success and failure semantics.
3. Record mobile confirmation only after the selected dataset has been
   validated, committed to IndexedDB, and read back successfully.
4. Keep a valid cached dataset available when a background version check or
   refresh fails.
5. Centralize language normalization, device policy, and confirmation-key
   behavior used by the loader and mobile UI.
6. Replace custom DOM events with a typed, in-process subscription contract.
7. Preserve the existing wordset endpoint, payloads, vocabulary selection,
   and desktop/mobile product behavior outside failure handling.

## Non-goals

- Moving wordsets to static or CDN delivery, introducing a manifest, or
  changing `/api/wordset`. That is backlog PR 3.
- Splitting or redesigning the wordset schema.
- Changing random word selection, level filtering, JLPT behavior, or game
  scoring.
- Refactoring unrelated game/session state.
- Redesigning the modal beyond the status, error, retry, and cancellation
  controls required by this lifecycle.
- Adding resumable or partial downloads.

## Terminology

- **Requested language:** the UI language passed by a caller.
- **Dataset language:** the normalized wordset identity. English and Japanese
  UI requests use the English dataset; Spanish uses the Spanish dataset.
- **Durable cache entry:** a validated dataset whose IndexedDB write
  transaction completed successfully and which can be read back.
- **Confirmation:** a local marker that the user-approved mobile download for
  a dataset language completed durably. It is not proof by itself that data is
  available.
- **Foreground acquisition:** a cache miss or explicit user retry that must
  finish before words mode becomes available.
- **Background revalidation:** a version check or refresh performed while a
  valid cached dataset remains usable.

## Functional Requirements

### 1. Lifecycle contract

The acquisition owner exposes a discriminated state whose `status` is one of:

| Status | Meaning |
| --- | --- |
| `idle` | No acquisition decision is in progress. |
| `checking-cache` | IndexedDB is being opened and the selected cache entry is being read and validated. |
| `awaiting-consent` | A mobile cache miss needs explicit user approval before network transfer. |
| `downloading` | A foreground wordset request is active. |
| `persisting` | Downloaded data passed validation and its IndexedDB transaction is pending. |
| `ready` | A valid wordset is available to the caller. |
| `failed` | A foreground operation failed and can be retried or cancelled. |

The state also carries the normalized dataset language. `downloading` carries
known byte progress when `Content-Length` is usable and otherwise reports
indeterminate progress. `ready` identifies whether data came from persistent
cache or is a desktop-only in-memory fallback. `failed` carries a typed error
category and a safe, localizable user message key rather than a raw exception.

Only valid transitions are exposed to UI callers. A superseded or cancelled
request must not publish later progress, persistence, ready, or failure state.

### 2. Typed failure model

Foreground failures are distinguished at least as:

- `network`: the request could not be completed;
- `http`: the response status is not successful and is not a valid `304`;
- `aborted`: the response stream ended before completion for a reason other
  than an explicit user cancellation;
- `parse`: the payload is not valid JSON;
- `validation`: the parsed payload does not match the supported wordset shape;
- `storage`: IndexedDB open, read, request, transaction, quota, or read-back
  verification failed.

Errors may retain their original cause for logging and tests, but UI messages
must not expose internal exception text. No acquisition-path catch block may
silently convert one of these failures into success.

An explicit user cancellation is a controlled transition, not a displayed
failure. It aborts the request, discards partial bytes, and returns mobile UI
to `awaiting-consent` with character mode active.

### 3. Dataset validation

Every network payload and persisted cache entry is validated before use. A
supported dataset must:

- be an object with a supported positive integer `version`;
- contain `hiraganaWords` and `katakanaWords` arrays, plus an optional
  `bothForms` array, matching the existing generated payloads and `WordSets`;
- contain word entries with non-empty `kana` and `romaji` strings, except the
  existing ungrouped legacy entries `ゝゞゐゑヽヾヰヱー`, whose empty romanization
  is preserved for compatibility with both production datasets;
- contain a valid `type`, a string-array `groups` value, and correctly typed
  optional fields used by the words domain;
- validate entries in `bothForms` using the same word-entry contract.

Validation checks all entries, not a sample. Unknown additional properties are
preserved. Validation must not mutate the downloaded object.

An invalid cached entry is treated as corrupt: it is not returned, its cache
entry and confirmation marker are cleared on a best-effort basis, and normal
cache-miss policy follows. Failure to remove corrupt data must not make it
usable.

### 4. Durable persistence

A cache write promise resolves only after the IndexedDB transaction emits
`complete`. It rejects on request error, transaction error, transaction abort,
quota failure, or database-open failure. Event handlers must settle the
operation exactly once.

After a foreground mobile write completes, the entry is read back and
validated before confirmation is recorded. The confirmation marker is written
after read-back succeeds. If recording the marker fails, the cache remains
valid and discoverable; the application may reconstruct confirmation from the
durable entry on the next check.

The memory cache is populated only with validated data. An in-flight request
may be shared by concurrent callers for the same dataset language, but a
failure must remove that in-flight entry so retry creates a new operation.

On desktop, a valid download remains usable for the current session when
IndexedDB persistence fails. This is represented as `ready` with in-memory
persistence and the storage failure remains observable for diagnostics; the
next browser session may download again. On consent-gated mobile, a storage
failure is `failed`, does not confirm the language, and does not enable words
mode because repeated large downloads would violate the consent contract.

### 5. Cache and revalidation policy

- A valid cache entry is sufficient to enter `ready`; the local confirmation
  marker is supplementary metadata, not an availability gate.
- A confirmation marker without a valid cache entry does not enable words
  mode. Mobile follows the cache-miss consent flow again.
- Switching between Japanese and English UI does not download or confirm a
  second dataset because both normalize to the English dataset.
- Switching between English/Japanese and Spanish checks the corresponding
  cache and confirmation independently.
- A cache hit is returned immediately and background revalidation begins
  without blocking the caller.
- `304 Not Modified` keeps the cached entry unchanged.
- Any background network, HTTP, parse, validation, or storage failure leaves
  the last valid cache entry and `ready` state intact. The failure is emitted
  as a non-blocking typed revalidation result for diagnostics; it does not
  show the mobile consent modal or a success notification.
- A successful background refresh validates and durably commits the new
  payload before replacing the memory entry or publishing an updated result.

The current request strategy remains unchanged in this PR: mobile cache hits
may use `HEAD` for version checks and desktop cache hits may fetch the payload,
while both continue to use `/api/wordset` and its existing ETag contract.

### 6. Mobile interaction

On a mobile cache miss, selecting words mode opens the consent modal in
`awaiting-consent`. Confirming starts the foreground lifecycle. The UI:

- displays determinate byte progress when total size is known and an
  indeterminate downloading state otherwise;
- does not display 100% until persistence and mobile read-back verification
  finish;
- closes the modal and activates words mode only after `ready` is reached;
- remains open in `failed`, displays the localized failure message, and offers
  Retry and Cancel;
- allows cancellation while downloading, which aborts the active request and
  keeps character mode active;
- does not retain stale progress or errors when the dataset language changes.

The advertised download size remains advisory. Failure to obtain it does not
authorize a download, report success, or prevent the user from explicitly
confirming.

### 7. Typed notifications and explicit updates

Wordset revalidation and manual update notifications use a typed subscription
API rather than `window.dispatchEvent`, `CustomEvent`, or string event names.
Subscribers can distinguish at least update availability, successful update,
and non-blocking revalidation failure.

An explicit update operation resolves with validated, durably persisted data
or rejects with a typed failure. It must not resolve `false` for failure, so
promise-based UI notifications cannot render a success toast for an error.
Subscriptions are removable and do not depend on a browser global, allowing
the behavior to be tested without DOM event casting.

### 8. Compatibility

- Existing callers that request words continue to receive the current
  `WordSets` domain shape.
- Character mode remains available while words mode awaits consent or fails.
- The service worker, endpoint ETags, build-time wordset generation, and
  fallback word lists are not changed.
- Existing valid IndexedDB entries remain readable after validation; no
  database-version bump is required unless the implementation plan identifies
  a schema change that this specification does not currently require.

## Edge Cases

- Missing or invalid `Content-Length` produces indeterminate progress.
- Zero-byte, truncated, or abruptly terminated response bodies fail before
  persistence.
- A response with a successful HTTP status but an error-shaped or unsupported
  JSON body fails validation.
- A `304` without a valid cached entry is an HTTP/protocol failure, not a
  successful empty result.
- Transaction `complete` after a prior request or abort error cannot reverse
  the failure.
- Two callers requesting the same normalized language share work; callers for
  Spanish and English do not.
- A language change or unmount aborts obsolete foreground work and prevents
  stale state from selecting words mode.
- Retry after any foreground failure starts from cache checking and cannot
  reuse a rejected promise or partial payload.
- A failed background refresh cannot overwrite either the durable or in-memory
  copy of the last valid dataset.
- Local storage being unavailable does not hide a valid durable cache entry.

## Test Requirements

Automated coverage must include:

1. Valid cache hit and cache miss behavior.
2. Corrupt cached data eviction and cache-miss fallback.
3. IndexedDB request error, transaction error/abort, quota error, and
   completion ordering.
4. HTTP error, network error, malformed JSON, invalid schema, zero/truncated
   body, and unexpected abort.
5. Known-length progress, unknown-length progress, persistence status, and no
   premature 100% state.
6. Successful validation, durable commit, read-back, confirmation, and words
   mode activation in that order.
7. Mobile cancellation, failure display, retry success, and cancel-after-error.
8. Desktop in-memory fallback on persistence failure and mobile refusal to
   confirm on the same failure.
9. Japanese/English normalization, Spanish switching, and superseded request
   protection.
10. Stale-while-revalidate success, `304`, and failure while cached content
    remains usable.
11. Concurrent request deduplication and retry after a rejected operation.
12. Typed update subscriptions, unsubscribe behavior, and explicit update
    rejection so error UI cannot report success.

## Acceptance Criteria

- The UI never closes the consent flow, selects words mode, writes a
  confirmation marker, or displays success after a failed foreground
  acquisition.
- A mobile confirmation implies that a validated dataset was committed and
  read back from IndexedDB.
- Cache write completion and failure reflect the IndexedDB transaction rather
  than merely queueing `put`.
- Every HTTP, stream, parse, validation, and IndexedDB failure has an explicit
  typed outcome; no empty catch block remains in the acquisition path.
- A valid cached dataset remains usable through background revalidation
  failure.
- Dataset language, device policy, and confirmation behavior have one shared
  implementation contract.
- Custom window events are absent from wordset acquisition and update flows.
- Desktop automatic acquisition and mobile consent behavior both work for the
  English/Japanese and Spanish dataset identities.
- Focused unit and integration tests cover the required success, failure,
  cancellation, retry, and stale-cache cases.
- Typecheck, lint, unit tests, relevant E2E tests, and the production build
  pass.
