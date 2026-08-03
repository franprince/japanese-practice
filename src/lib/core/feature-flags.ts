// The Ollama practice mode depends on a locally-reachable Ollama server and
// a persistent SQLite-backed quiz bank — neither is guaranteed by every
// deployment target this app ships to. Until that's resolved, the feature
// is opt-in only, off by default, so it doesn't appear as a broken tile to
// visitors on environments where it can't work.
export const isOllamaPracticeEnabled = process.env.NEXT_PUBLIC_ENABLE_OLLAMA_PRACTICE === "true"
