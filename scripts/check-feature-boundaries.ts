import path from "node:path"
import ts from "typescript"

// Changes here describe the Words feature's allowed dependency directions.
const featureRoots = ["src/components/words", "src/lib/japanese/words", "src/lib/japanese/wordsets"] as const
const sharedRoot = "src/lib/japanese/shared"
const datasetRoot = featureRoots[2]
const domainRoot = featureRoots[1]
const entryPoints = new Set([...featureRoots.map(root => `${root}/index.ts`), `${datasetRoot}/build.ts`])
const extensions = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".json"]
const assetPattern = /\.(?:json|css|scss|sass|less|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|otf)$/i
const sourcePattern = /\.[cm]?[jt]sx?$/

export interface BoundaryDiagnostic {
    code: "internal-import" | "self-barrel" | "wildcard-export" | "unresolved-local" | "computed-import" | "cycle" | "layer" | "build-isolation" | "contract-layer"
    file: string
    line: number
    message: string
    /** Repository-relative dependency path, including its forbidden destination. */
    trace?: string[]
}

export interface BoundaryAnalysisOptions {
    /** Absolute repository root, used by TypeScript's module resolver. */
    rootDir: string
    /** Complete source inventory, keyed by repository-relative filename; fixtures stay in memory. */
    files: Readonly<Record<string, string>>
    /** Parsed tsconfig options; relative baseUrl is interpreted relative to rootDir. */
    compilerOptions: ts.CompilerOptions
}

interface Edge { target?: string; specifier: string; line: number; local: boolean }
interface Module { edges: Edge[]; computed: number[] }

const slash = (value: string) => value.replaceAll("\\", "/")
const within = (file: string, directory: string) => file === directory || file.startsWith(`${directory}/`)
const owner = (file: string) => featureRoots.find(root => within(file, root))
const unitTest = (file: string) => within(file, "src") && (file.includes("/__tests__/") || /\.test\.[cm]?[jt]sx?$/.test(file))
const testConsumer = (file: string) => unitTest(file) || within(file, "e2e") || /\.spec\.[cm]?[jt]sx?$/.test(file)
const uiModule = (file: string) => ["app", "src/components", "src/hooks"].some(root => within(file, root))
const affected = (file: string) => Boolean(owner(file)) || within(file, sharedRoot) || within(file, "app/words") ||
    /^src\/hooks\/use-(?:word-game|mobile-wordset|mobile-device|wordset-update)\.[cm]?[jt]sx?$/.test(file)
const reactPackage = (specifier: string) => /^(?:react|react-dom)(?:\/|$)/.test(specifier)

/** Analyze source text without executing it. Both runtime and type edges enforce boundaries. */
export function analyzeFeatureBoundaries({ rootDir, files, compilerOptions }: BoundaryAnalysisOptions): BoundaryDiagnostic[] {
    const root = path.resolve(rootDir)
    const absolute = (file: string) => slash(path.resolve(root, file))
    const relative = (file: string) => slash(path.relative(root, file))
    const sources = new Map(Object.entries(files).map(([file, text]) => [absolute(file), text]))
    const directories = new Set<string>()
    for (const file of sources.keys()) {
        let directory = slash(path.dirname(file))
        while (!directories.has(directory)) {
            directories.add(directory)
            const parent = slash(path.dirname(directory))
            if (parent === directory) break
            directory = parent
        }
    }
    const options = { ...compilerOptions, baseUrl: path.resolve(root, compilerOptions.baseUrl ?? ".") }
    const host: ts.ModuleResolutionHost = {
        fileExists: file => sources.has(absolute(file)),
        readFile: file => sources.get(absolute(file)),
        directoryExists: directory => directories.has(absolute(directory)),
        getCurrentDirectory: () => root,
        realpath: file => absolute(file),
    }
    const cache = ts.createModuleResolutionCache(root, file => file, options)
    const diagnostics: BoundaryDiagnostic[] = []
    const modules = new Map<string, Module>()
    const isLocal = (specifier: string) => specifier.startsWith(".") || path.isAbsolute(specifier) ||
        Object.keys(options.paths ?? {}).some(alias => {
            const wildcard = alias.indexOf("*")
            return wildcard === -1 ? specifier === alias : specifier.startsWith(alias.slice(0, wildcard)) && specifier.endsWith(alias.slice(wildcard + 1))
        })

    for (const [filename, text] of sources) {
        if (!sourcePattern.test(filename)) continue
        const file = relative(filename)
        const source = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true)
        const module: Module = { edges: [], computed: [] }
        modules.set(file, module)
        const lineOf = (node: ts.Node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
        const add = (specifier: ts.Node | undefined, node: ts.Node) => {
            if (!specifier || !ts.isStringLiteralLike(specifier)) { module.computed.push(lineOf(node)); return }
            const name = specifier.text
            const resolved = ts.resolveModuleName(name, filename, options, host, cache).resolvedModule
            module.edges.push({ specifier: name, target: resolved ? relative(resolved.resolvedFileName) : undefined, line: lineOf(node), local: isLocal(name) })
        }
        const visit = (node: ts.Node) => {
            if (ts.isImportDeclaration(node)) add(node.moduleSpecifier, node)
            else if (ts.isExportDeclaration(node)) {
                if (node.moduleSpecifier) add(node.moduleSpecifier, node)
                if (entryPoints.has(file) && (!node.exportClause || ts.isNamespaceExport(node.exportClause))) {
                    diagnostics.push({ code: "wildcard-export", file, line: lineOf(node), message: "Public entry points must expose named exports instead of wildcard exports." })
                }
            } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) add(node.argument.literal, node)
            else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) add(node.moduleReference.expression, node)
            else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
                (ts.isIdentifier(node.expression) && node.expression.text === "require"))) add(node.arguments[0], node)
            ts.forEachChild(node, visit)
        }
        visit(source)
    }

    for (const [file, module] of modules) {
        for (const edge of module.edges) {
            if (!edge.target) continue
            const targetOwner = owner(edge.target)
            const sourceOwner = owner(file)
            const colocated = unitTest(file) && sourceOwner !== undefined && sourceOwner === targetOwner
            if (targetOwner && sourceOwner !== targetOwner && !entryPoints.has(edge.target)) {
                diagnostics.push({ code: "internal-import", file, line: edge.line, message: `Use the public entry point instead of ${edge.target}.` })
            } else if (targetOwner && sourceOwner === targetOwner && entryPoints.has(edge.target) && !colocated) {
                diagnostics.push({ code: "self-barrel", file, line: edge.line, message: `Feature internals must import direct dependencies instead of their own ${edge.target}.` })
            }
            if (uiModule(file) && within(edge.target, sharedRoot) && edge.target !== `${sharedRoot}/index.ts`) {
                diagnostics.push({ code: "internal-import", file, line: edge.line, message: `UI consumers must use the shared public entry point instead of ${edge.target}.` })
            }
        }
    }

    const production = new Map([...modules].filter(([file]) => !testConsumer(file)))
    const localEdges = (file: string) => (production.get(file)?.edges ?? []).filter(edge => edge.target && production.has(edge.target))
    const guarded = new Set<string>()
    const guard = (file: string) => {
        if (guarded.has(file)) return
        guarded.add(file)
        for (const edge of localEdges(file)) guard(edge.target!)
    }
    for (const file of modules.keys()) if (affected(file)) guard(file)
    const namesGuardedTarget = (file: string, specifier: string) => {
        if (specifier.startsWith(".")) return affected(relative(path.resolve(root, path.dirname(file), specifier)))
        if (path.isAbsolute(specifier)) return affected(relative(specifier))
        return Object.entries(options.paths ?? {}).some(([alias, targets]) => {
            const wildcard = alias.indexOf("*")
            if (wildcard === -1 && specifier !== alias) return false
            const prefix = wildcard === -1 ? alias : alias.slice(0, wildcard)
            const suffix = wildcard === -1 ? "" : alias.slice(wildcard + 1)
            if (!specifier.startsWith(prefix) || !specifier.endsWith(suffix)) return false
            const matched = specifier.slice(prefix.length, specifier.length - suffix.length)
            return targets.some(target => affected(relative(path.resolve(options.baseUrl, target.replace("*", matched)))))
        })
    }
    for (const [file, module] of modules) {
        for (const edge of module.edges) {
            if (!edge.target && edge.local && !assetPattern.test(edge.specifier) && (guarded.has(file) || namesGuardedTarget(file, edge.specifier))) {
                diagnostics.push({ code: "unresolved-local", file, line: edge.line, message: `Cannot resolve local dependency ${edge.specifier}; its boundary cannot be verified.` })
            }
        }
        if (guarded.has(file)) for (const line of module.computed) {
            diagnostics.push({ code: "computed-import", file, line, message: "Use a literal module specifier so the affected dependency graph can be verified." })
        }
    }

    // Search the full local graph so a shared/core/types intermediary cannot hide a forbidden edge.
    const forbiddenPath = (start: string, forbidden: (edge: Edge) => boolean): string[] | undefined => {
        const queue: string[][] = [[start]]
        const visited = new Set([start])
        for (let i = 0; i < queue.length; i++) {
            const trace = queue[i]!
            for (const edge of production.get(trace.at(-1)!)?.edges ?? []) {
                const destination = edge.target ?? edge.specifier
                if (forbidden(edge)) return [...trace, destination]
                if (edge.target && production.has(edge.target) && !visited.has(edge.target)) {
                    visited.add(edge.target)
                    queue.push([...trace, edge.target])
                }
            }
        }
    }
    const reportPath = (file: string, code: BoundaryDiagnostic["code"], reason: string, forbidden: (edge: Edge) => boolean) => {
        const trace = forbiddenPath(file, forbidden)
        if (trace) diagnostics.push({ code, file, line: 1, message: reason, trace })
    }
    const orchestration = (file: string) => within(file, datasetRoot) && /\/(?:acquisition|loader)\.[cm]?[jt]sx?$/.test(file)
    for (const file of production.keys()) {
        if (within(file, domainRoot) || within(file, datasetRoot)) {
            reportPath(file, "layer", "Practice and dataset modules must not depend on React or UI modules.", edge => reactPackage(edge.specifier) || Boolean(edge.target && uiModule(edge.target)))
        }
        if (within(file, datasetRoot)) {
            reportPath(file, "layer", "Dataset modules must not depend on Words practice logic.", edge => Boolean(edge.target && within(edge.target, domainRoot)))
        }
        if (file === `${datasetRoot}/build.ts`) {
            reportPath(file, "build-isolation", "The build contract must not depend on acquisition or browser persistence/policy.", edge => Boolean(edge.target && (
                orchestration(edge.target) || edge.target === "src/lib/core/db.ts" ||
                (within(edge.target, datasetRoot) && /\/(?:storage|policy)\.[cm]?[jt]sx?$/.test(edge.target))
            )))
        }
        if (file === `${datasetRoot}/contracts.ts` || file === `${datasetRoot}/errors.ts`) {
            reportPath(file, "contract-layer", "Neutral contracts and errors must not depend on acquisition orchestration.", edge => Boolean(edge.target && orchestration(edge.target)))
        }
    }

    // Tarjan SCCs include type dependencies and mediators outside the affected feature roots.
    let sequence = 0
    const indices = new Map<string, number>()
    const low = new Map<string, number>()
    const stack: string[] = []
    const active = new Set<string>()
    const connect = (file: string) => {
        indices.set(file, sequence)
        low.set(file, sequence++)
        stack.push(file)
        active.add(file)
        for (const edge of localEdges(file)) {
            const target = edge.target!
            if (!indices.has(target)) { connect(target); low.set(file, Math.min(low.get(file)!, low.get(target)!)) }
            else if (active.has(target)) low.set(file, Math.min(low.get(file)!, indices.get(target)!))
        }
        if (low.get(file) !== indices.get(file)) return
        const component: string[] = []
        let member: string
        do { member = stack.pop()!; active.delete(member); component.push(member) } while (member !== file)
        const start = component.find(affected)
        if (!start || (component.length === 1 && !localEdges(start).some(edge => edge.target === start))) return
        const members = new Set(component)
        const findCycle = (current: string, trace: string[]): string[] | undefined => {
            for (const edge of localEdges(current)) {
                const target = edge.target!
                if (!members.has(target)) continue
                if (target === start) return [...trace, start]
                if (!trace.includes(target)) {
                    const found = findCycle(target, [...trace, target])
                    if (found) return found
                }
            }
        }
        diagnostics.push({ code: "cycle", file: start, line: 1, message: "The affected feature graph contains a dependency cycle.", trace: findCycle(start, [start]) })
    }
    for (const file of production.keys()) if (!indices.has(file)) connect(file)
    return diagnostics.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.code.localeCompare(b.code) || a.message.localeCompare(b.message))
}

/** Read the repository's config and source inventory; generated files and dependencies are excluded. */
export function checkFeatureBoundaries(rootDir = process.cwd()): BoundaryDiagnostic[] {
    const root = path.resolve(rootDir)
    const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile)
    if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"))
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
    if (parsed.errors.length) throw new Error(parsed.errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n"))
    const files: Record<string, string> = {}
    for (const directory of ["app", "src", "scripts", "e2e"]) {
        for (const file of ts.sys.readDirectory(path.join(root, directory), extensions, ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/test-results/**", "**/playwright-report/**"])) {
            files[slash(path.relative(root, file))] = file.endsWith(".json") ? "" : ts.sys.readFile(file) ?? ""
        }
    }
    return analyzeFeatureBoundaries({ rootDir: root, files, compilerOptions: parsed.options })
}

if (import.meta.main) {
    const diagnostics = checkFeatureBoundaries()
    for (const diagnostic of diagnostics) {
        console.error(`${diagnostic.file}:${diagnostic.line} [${diagnostic.code}] ${diagnostic.message}${diagnostic.trace ? `\n  ${diagnostic.trace.join(" -> ")}` : ""}`)
    }
    if (diagnostics.length) process.exitCode = 1
    else console.log("Words feature boundaries pass.")
}
