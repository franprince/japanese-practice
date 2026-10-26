// Vitest-style helpers for the tests ported from Nihongo Rubi, on top of bun:test.
import { mock, spyOn } from "bun:test"

const globals = new Map<string, unknown>()
const envs = new Map<string, string | undefined>()

export const vi = {
  fn: mock,
  spyOn,
  stubGlobal(name: string, value: unknown) {
    const g = globalThis as Record<string, unknown>
    if (!globals.has(name)) globals.set(name, g[name])
    g[name] = value
  },
  unstubAllGlobals() {
    const g = globalThis as Record<string, unknown>
    for (const [name, value] of globals) g[name] = value
    globals.clear()
  },
  stubEnv(name: string, value: string) {
    if (!envs.has(name)) envs.set(name, process.env[name])
    process.env[name] = value
  },
  unstubAllEnvs() {
    for (const [name, value] of envs) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
    envs.clear()
  },
  restoreAllMocks() {
    mock.restore()
  },
}
