/**
 * Chōwa routing policy for nihongo-renshuu.
 *
 * The presence of this file opts the repo into Chōwa's conventions:
 * spec -> plan -> execute pipeline (docs under `specs/`), feature branches
 * off `main`, atomic Conventional Commits, and the project's own quality
 * gates (`bun test src`, `bunx tsc --noEmit`, `bun run lint`, `bun run build`).
 *
 * Rules are matched by `kind` (and optionally `estimatedComplexity`); the
 * highest `priority` match wins, falling back to `defaultTarget`.
 *
 * Every target here is Anthropic so the policy works with no extra provider
 * credentials. Swap a `target` if you wire up another provider.
 */
export default {
  routing: {
    rules: [
      // Rote work — locale key sync, import fixes, config edits.
      {
        match: { kind: "mechanical" },
        target: { provider: "anthropic", model: "claude-haiku-4-5-20251001" },
        priority: 10,
      },
      // The Ollama quiz surface takes untrusted input and shells out to an LLM.
      {
        match: { kind: "security" },
        target: { provider: "anthropic", model: "claude-opus-5" },
        priority: 100,
      },
      // Data-layer and deployment decisions (SQLite persistence, Docker).
      {
        match: { kind: "architecture", estimatedComplexity: "high" },
        target: { provider: "anthropic", model: "claude-opus-5" },
        priority: 50,
      },
      // Cross-cutting refactors of the shared game primitives / hooks.
      {
        match: { kind: "refactor", estimatedComplexity: "high" },
        target: { provider: "anthropic", model: "claude-opus-5" },
        priority: 40,
      },
      // Furigana parsing and multi-blank scoring bugs are fiddly to trace.
      {
        match: { kind: "debug", estimatedComplexity: "high" },
        target: { provider: "anthropic", model: "claude-opus-5" },
        priority: 30,
      },
    ],
    defaultTarget: { provider: "anthropic", model: "claude-sonnet-5" },
  },
};
