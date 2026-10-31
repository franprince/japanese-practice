// What the DeepL routes share: the host for the key's plan, the auth header, and a time limit, so a slow DeepL
// cannot hold a function open until the platform kills it.

const TIMEOUT_MS = 10_000

/** Calls DeepL with `key`. Rejects when DeepL is unreachable or takes longer than TIMEOUT_MS; see `unreachable`. */
export function fetchDeepL(key: string, path: string, init: RequestInit = {}): Promise<Response> {
  // Free-plan keys end in ":fx" and use their own host.
  const host = key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com'
  return fetch(`${host}${path}`, {
    ...init,
    headers: { Authorization: `DeepL-Auth-Key ${key}`, ...(init.headers as Record<string, string> | undefined) },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
}

/** The answer for a `fetchDeepL` that rejected. */
export function unreachable(error: unknown): Response {
  return error instanceof Error && error.name === 'TimeoutError'
    ? Response.json({ error: 'DeepL took too long to answer' }, { status: 504 })
    : Response.json({ error: "DeepL couldn't be reached" }, { status: 502 })
}
