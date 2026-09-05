import path from "node:path"
import { describe, expect, test } from "bun:test"
import ts from "typescript"
import { analyzeFeatureBoundaries, checkFeatureBoundaries } from "../../scripts/check-feature-boundaries"

const rootDir = "/boundary-fixture"
const compilerOptions: ts.CompilerOptions = {
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    module: ts.ModuleKind.Preserve,
    jsx: ts.JsxEmit.ReactJSX,
    allowJs: true,
    allowImportingTsExtensions: true,
    baseUrl: rootDir,
    paths: { "@/*": ["src/*"] },
}
const domain = "src/lib/japanese/words"
const datasets = "src/lib/japanese/wordsets"
const ui = "src/components/words"
const shared = "src/lib/japanese/shared"
const analyze = (files: Record<string, string>) => analyzeFeatureBoundaries({ rootDir, files, compilerOptions })
const codes = (files: Record<string, string>) => analyze(files).map(diagnostic => diagnostic.code)

describe("Words boundary checker fixtures", () => {
    test("accepts public aliases, relative/explicit entry points, same-feature leaves and colocated tests", () => {
        expect(analyze({
            "app/words/page.tsx": `import { GameCard } from "@/components/words"; import type { Word } from "../../src/lib/japanese/words/index.ts"; import { metadata } from "@/lib/japanese/wordsets/build"`,
            [`${ui}/index.ts`]: `export { GameCard } from "./game-card"`,
            [`${ui}/game-card.tsx`]: `import { select } from "@/lib/japanese/words"; export const GameCard = select`,
            [`${domain}/index.ts`]: `export { select } from "./selection"; export type { Word } from "@/types/japanese"`,
            [`${domain}/selection.ts`]: `import { filter } from "./filtering"; import { acquire } from "../wordsets"; export const select = () => filter(acquire())`,
            [`${domain}/filtering.ts`]: `export const filter = (data: unknown) => data`,
            [`${domain}/__tests__/filtering.test.ts`]: `import { filter } from "../filtering"; import { select } from ".."`,
            [`${datasets}/index.ts`]: `export { acquire } from "./acquisition"`,
            [`${datasets}/acquisition.ts`]: `export const acquire = () => []`,
            [`${datasets}/build.ts`]: `export { metadata } from "./manifest"`,
            [`${datasets}/manifest.ts`]: `export const metadata = {}`,
            "src/types/japanese.ts": `export type Word = string`,
        })).toEqual([])
    })

    for (const [name, statement] of [
        ["named alias", `import { value } from "@/lib/japanese/words/selection"`],
        ["relative", `import { value } from "../../src/lib/japanese/words/selection"`],
        ["type import", `import type { Value } from "@/lib/japanese/words/selection"`],
        ["inline type import", `import { type Value } from "@/lib/japanese/words/selection"`],
        ["named re-export", `export { value } from "@/lib/japanese/words/selection"`],
        ["type re-export", `export type { Value } from "@/lib/japanese/words/selection"`],
        ["star re-export", `export * from "@/lib/japanese/words/selection"`],
        ["type star re-export", `export type * from "@/lib/japanese/words/selection"`],
        ["namespace re-export", `export * as selection from "@/lib/japanese/words/selection"`],
        ["dynamic import", `const load = () => import("@/lib/japanese/words/selection")`],
        ["template literal import", "const load = () => import(`@/lib/japanese/words/selection`)"],
        ["import type expression", `type Value = import("@/lib/japanese/words/selection").Value`],
        ["typeof import", `type Module = typeof import("@/lib/japanese/words/selection")`],
        ["require", `const selection = require("@/lib/japanese/words/selection")`],
        ["import equals", `import selection = require("@/lib/japanese/words/selection")`],
        ["side effect", `import "@/lib/japanese/words/selection"`],
    ]) {
        test(`rejects ${name} access to another feature's internals`, () => {
            const result = analyze({
                "app/words/page.tsx": statement!,
                [`${domain}/selection.ts`]: `export const value = 1; export type Value = number`,
            })
            expect(result).toContainEqual(expect.objectContaining({ code: "internal-import", file: "app/words/page.tsx", line: 1 }))
        })
    }

    for (const root of [ui, domain, datasets]) {
        test(`protects ${root} internals from external consumers`, () => {
            expect(codes({
                "src/test/helper.ts": `export { value } from "../../${root}/internal"`,
                [`${root}/internal.ts`]: `export const value = 1`,
            })).toContain("internal-import")
        })
    }

    for (const entry of [".", "./index", "./index.ts", "@/lib/japanese/words"]) {
        test(`rejects internal self-barrel spelling ${entry}`, () => {
            const result = analyze({
                [`${domain}/index.ts`]: `export { value } from "./selection"`,
                [`${domain}/selection.ts`]: `import { value as other } from "${entry}"; export const value = other`,
            })
            expect(result.some(item => item.code === "self-barrel")).toBe(true)
            expect(result.some(item => item.code === "cycle")).toBe(true)
        })
    }

    test("build and runtime dataset entry points cannot import each other", () => {
        expect(codes({
            [`${datasets}/index.ts`]: `export { validate } from "./build"`,
            [`${datasets}/build.ts`]: `export const validate = () => true`,
        })).toContain("self-barrel")
    })

    for (const statement of [`export * from "./selection"`, `export type * from "./selection"`, `export * as selection from "./selection"`]) {
        test(`rejects public wildcard export: ${statement}`, () => {
            expect(codes({ [`${domain}/index.ts`]: statement, [`${domain}/selection.ts`]: "export const value = 1" })).toContain("wildcard-export")
        })
    }

    test("only tests colocated within the owning feature may import internals", () => {
        const result = analyze({
            [`${domain}/selection.ts`]: `export const value = 1`,
            [`${domain}/selection.test.ts`]: `import { value } from "./selection"`,
            [`${domain}/__tests__/selection.test.ts`]: `import { value } from "../selection"`,
            [`${datasets}/__tests__/selection.test.ts`]: `import { value } from "../../words/selection"`,
            "src/hooks/__tests__/use-word-game.test.ts": `import { value } from "@/lib/japanese/words/selection"`,
            "src/test/wordset-fixture.ts": `import { value } from "@/lib/japanese/words/selection"`,
            "e2e/tests/words.spec.ts": `import { value } from "../../src/lib/japanese/words/selection"`,
            "scripts/publish-wordsets.ts": `import { value } from "../src/lib/japanese/words/selection"`,
        })
        expect(result.filter(item => item.code === "internal-import").map(item => item.file)).toEqual([
            "e2e/tests/words.spec.ts", "scripts/publish-wordsets.ts", "src/hooks/__tests__/use-word-game.test.ts",
            `${datasets}/__tests__/selection.test.ts`, "src/test/wordset-fixture.ts",
        ].sort())
    })

    test("injected service types must use the runtime public API", () => {
        const common = { [`${datasets}/index.ts`]: `export type { Service } from "./acquisition"`, [`${datasets}/acquisition.ts`]: `export interface Service {}` }
        expect(analyze({ ...common, "src/hooks/use-mobile-wordset.ts": `import type { Service } from "@/lib/japanese/wordsets"` })).toEqual([])
        expect(codes({ ...common, "src/hooks/use-mobile-wordset.ts": `import type { Service } from "@/lib/japanese/wordsets/acquisition"` })).toContain("internal-import")
    })

    test("UI uses the shared facade while domain code may use shared/core leaves", () => {
        const common = {
            [`${shared}/index.ts`]: `export { convert } from "./input"`,
            [`${shared}/input.ts`]: `export const convert = () => "a"`,
            "src/lib/core/random.ts": `export const random = () => 0.5`,
            [`${domain}/selection.ts`]: `import { convert } from "../shared/input"; import { random } from "@/lib/core/random"`,
        }
        expect(analyze({ ...common, "src/hooks/use-word-game.ts": `import { convert } from "@/lib/japanese/shared"` })).toEqual([])
        expect(codes({ ...common, "src/hooks/use-word-game.ts": `import { convert } from "@/lib/japanese/shared/input"` })).toContain("internal-import")
    })

    for (const [destination, source] of [
        ["react", `export const value = 1`],
        ["react/jsx-runtime", `export const value = 1`],
        ["react-dom/client", `export const value = 1`],
        ["src/hooks/use-hydrated.ts", `export const value = 1`],
        ["src/components/ui/button.tsx", `export const value = 1`],
        ["app/words/page.tsx", `export const value = 1`],
    ]) {
        test(`rejects direct and transitive domain/UI dependency on ${destination}`, () => {
            const specifier = destination!.startsWith("src/") ? `@/${destination!.slice(4)}` : destination!.startsWith("app/") ? `../../${destination}` : destination!
            for (const intermediate of [false, true]) {
                const result = analyze({
                    [`${domain}/evaluation.ts`]: intermediate ? `import type { Value } from "@/types/bridge"` : `import { value } from "${destination!.startsWith("app/") ? `../../../../${destination}` : specifier}"`,
                    "src/types/bridge.ts": `export { value as Value } from "${specifier}"`,
                    ...(destination!.includes(".ts") ? { [destination!]: source! } : {}),
                })
                expect(result).toContainEqual(expect.objectContaining({ code: "layer", file: `${domain}/evaluation.ts` }))
            }
        })
    }

    test("detects React hidden behind broad type and i18n barrels", () => {
        const result = analyze({
            [`${datasets}/contracts.ts`]: `import type { Language } from "@/types"`,
            "src/types/index.ts": `export * from "./ui"`,
            "src/types/ui.ts": `export type { Language } from "../lib/i18n"`,
            "src/lib/i18n/index.ts": `export * from "./language-context"`,
            "src/lib/i18n/language-context.tsx": `import { useState } from "react"; export type Language = string`,
        })
        expect(result).toContainEqual(expect.objectContaining({ code: "layer", trace: [
            `${datasets}/contracts.ts`, "src/types/index.ts", "src/types/ui.ts", "src/lib/i18n/index.ts", "src/lib/i18n/language-context.tsx", "react",
        ] }))
    })

    test("local declaration files cannot hide type dependencies on React", () => {
        expect(analyze({
            [`${datasets}/contracts.ts`]: `import type { Value } from "@/types/browser"`,
            "src/types/browser.d.ts": `export type Value = import("react").ReactNode`,
        })).toContainEqual(expect.objectContaining({ code: "layer", trace: [
            `${datasets}/contracts.ts`, "src/types/browser.d.ts", "react",
        ] }))
    })

    test("datasets cannot reach practice logic through lower-level types", () => {
        expect(codes({
            [`${datasets}/validation.ts`]: `import type { Word } from "@/types/bridge"`,
            "src/types/bridge.ts": `export type { Word } from "@/lib/japanese/words"`,
            [`${domain}/index.ts`]: `export type Word = string`,
        })).toContain("layer")
    })

    for (const forbidden of [`${datasets}/acquisition.ts`, `${datasets}/loader.ts`, `${datasets}/storage.ts`, `${datasets}/policy.ts`, "src/lib/core/db.ts"]) {
        test(`build contracts cannot reach ${forbidden} directly or indirectly`, () => {
            for (const intermediate of [false, true]) {
                const specifier = `@/${forbidden.slice(4)}`
                const result = analyze({
                    [`${datasets}/build.ts`]: intermediate ? `export { value } from "./manifest"` : `export { value } from "${specifier}"`,
                    [`${datasets}/manifest.ts`]: `import type { Value } from "${specifier}"; export const value = 1`,
                    [forbidden]: `export const value = 1; export type Value = number`,
                })
                expect(result).toContainEqual(expect.objectContaining({ code: "build-isolation", file: `${datasets}/build.ts` }))
            }
        })
    }

    for (const neutral of ["contracts", "errors"]) {
        test(`${neutral} cannot reach orchestration through another contract`, () => {
            expect(codes({
                [`${datasets}/${neutral}.ts`]: `import type { State } from "./bridge"`,
                [`${datasets}/bridge.ts`]: `export type { State } from "./acquisition"`,
                [`${datasets}/acquisition.ts`]: `export type State = string`,
            })).toContain("contract-layer")
        })
    }

    test("finds a cycle through shared/core/types mediators and type-only edges", () => {
        const result = analyze({
            [`${domain}/index.ts`]: `export type { Word } from "./selection"`,
            [`${domain}/selection.ts`]: `import type { Word } from "@/types/bridge"`,
            "src/types/bridge.ts": `export type { Word } from "@/lib/core/bridge"`,
            "src/lib/core/bridge.ts": `export type { Word } from "@/lib/japanese/words"`,
        })
        const cycle = result.find(item => item.code === "cycle")
        expect(cycle?.trace).toContain("src/types/bridge.ts")
        expect(cycle?.trace).toContain("src/lib/core/bridge.ts")
        expect(cycle?.trace?.[0]).toBe(cycle?.trace?.at(-1))
    })

    test("detects direct self cycles", () => {
        expect(codes({ [`${domain}/selection.ts`]: `import "./selection"` })).toContain("cycle")
    })

    test("does not report unrelated cycles, even when reachable from a feature", () => {
        expect(analyze({
            [`${domain}/selection.ts`]: `import "@/lib/core/first"`,
            "src/lib/core/first.ts": `import "./second"`,
            "src/lib/core/second.ts": `import "./first"`,
        })).toEqual([])
    })

    test("unit and E2E consumers are checked but excluded from production cycles/layers", () => {
        expect(analyze({
            [`${domain}/selection.test.ts`]: `import "./other.test"; import { render } from "@testing-library/react"; import "react"`,
            [`${domain}/other.test.ts`]: `import "./selection.test"`,
            "e2e/tests/words.spec.ts": `import "./other.spec"`,
            "e2e/tests/other.spec.ts": `import "./words.spec"`,
        })).toEqual([])
    })

    test("fails unresolved guarded local imports, including external consumers targeting internals", () => {
        const result = analyze({
            [`${domain}/selection.ts`]: `import "./missing"; import "@/types/bridge"`,
            "src/types/bridge.ts": `export type { Value } from "./missing"`,
            "scripts/publish-wordsets.ts": `import { validate } from "../src/lib/japanese/wordsets/missing"`,
        })
        expect(result.filter(item => item.code === "unresolved-local").map(item => item.file)).toEqual([
            "scripts/publish-wordsets.ts", `${domain}/selection.ts`, "src/types/bridge.ts",
        ].sort())
    })

    test("allows local assets, external packages, and ignores mock/fixture string literals", () => {
        expect(analyze({
            [`${domain}/romaji.ts`]: `import data from "../shared/kanaDictionary.json"; import "./style.css"; import { value } from "third-party"; import fs from "node:fs"; const specimen = 'import "@/lib/japanese/words/internal"'; mock.module("@/lib/japanese/words/internal", () => ({}))`,
            [`${shared}/kanaDictionary.json`]: "{}",
        })).toEqual([])
    })

    test("computed dependencies in the guarded graph are explicit failures", () => {
        expect(codes({ [`${domain}/selection.ts`]: `const load = (name: string) => import(name); require(name)` })).toEqual(["computed-import", "computed-import"])
    })

    test("uses supplied TypeScript path mappings, not an alias-specific regex", () => {
        const result = analyzeFeatureBoundaries({
            rootDir,
            compilerOptions: { ...compilerOptions, paths: { "practice/*": ["src/lib/japanese/words/*"] } },
            files: { "app/words/page.tsx": `import "practice/selection"`, [`${domain}/selection.ts`]: "export const value = 1" },
        })
        expect(result).toContainEqual(expect.objectContaining({ code: "internal-import" }))
    })

    test("unresolved custom aliases cannot conceal an external consumer of a feature", () => {
        expect(analyzeFeatureBoundaries({
            rootDir,
            compilerOptions: { ...compilerOptions, paths: { "practice/*": ["src/lib/japanese/words/*"] } },
            files: { "scripts/consumer.ts": `import "practice/missing"` },
        })).toContainEqual(expect.objectContaining({ code: "unresolved-local", file: "scripts/consumer.ts" }))
    })
})

test("real production Words graph respects feature boundaries", () => {
    const repository = path.resolve(import.meta.dir, "../..")
    expect(checkFeatureBoundaries(repository)).toEqual([])
})
