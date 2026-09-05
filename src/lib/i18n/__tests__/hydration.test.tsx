import { afterEach, describe, expect, it } from "bun:test"
import { act, render, screen, waitFor } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { hydrateRoot, type Root } from "react-dom/client"
import { I18nProvider, useI18n } from "../i18n"
import { ThemeProvider, useTheme } from "@/lib/theme"
import type { Language } from "../translations"

function Preferences() {
    const { lang, setLang, t, isLoading } = useI18n()
    const { theme, setTheme } = useTheme()
    return <div>
        <output data-testid="preference-value">{lang}:{theme}:{t("wordsLabel")}:{String(isLoading)}</output>
        <button onClick={() => setLang("es")}>Spanish</button>
        <button onClick={() => setLang("ja")}>Japanese</button>
        <button onClick={() => setLang("en")}>English</button>
        <button onClick={() => setTheme("ocean")}>Ocean</button>
    </div>
}
const ui = <ThemeProvider><I18nProvider initialLang="en"><Preferences /></I18nProvider></ThemeProvider>
afterEach(() => localStorage.clear())

describe("preference hydration", () => {
    for (const saved of [null, "es", "invalid"] as const) {
        it(`hydrates saved language ${saved} and theme without recoverable errors or default writes`, async () => {
            localStorage.clear()
            if (saved) localStorage.setItem("kana-words-lang", saved)
            localStorage.setItem("theme", "mint")
            const container = document.createElement("div")
            container.innerHTML = renderToString(ui)
            expect(container.textContent).toContain("en:default:")
            document.body.appendChild(container)
            const errors: unknown[] = []
            let root!: Root
            try {
                await act(async () => { root = hydrateRoot(container, ui, { onRecoverableError: error => errors.push(error) }) })
                await waitFor(() => expect(container.textContent).toContain(`${saved === "es" ? "es" : "en"}:mint:`))
                expect(errors).toEqual([])
                expect(localStorage.getItem("kana-words-lang")).toBe(saved)
                expect(localStorage.getItem("theme")).toBe("mint")
            } finally {
                act(() => root?.unmount())
                container.remove()
            }
        })
    }
    it("rejects obsolete translation results and keeps English immediate", async () => {
        const pending = new Map<Language, (messages: Record<string, string>) => void>()
        const loader = (lang: Language) => new Promise<Record<string, string>>(resolve => pending.set(lang, resolve))
        render(<ThemeProvider><I18nProvider initialLang="en" translationLoader={loader}><Preferences /></I18nProvider></ThemeProvider>)
        act(() => screen.getByText("Spanish").click())
        act(() => screen.getByText("Japanese").click())
        await act(async () => pending.get("ja")!({ wordsLabel: "Japanese words" }))
        await act(async () => pending.get("es")!({ wordsLabel: "Spanish words" }))
        expect(screen.getByTestId("preference-value").textContent).toBe("ja:default:Japanese words:false")
        expect(document.documentElement.lang).toBe("ja")
        act(() => screen.getByText("Spanish").click())
        act(() => screen.getByText("English").click())
        await act(async () => pending.get("es")!({ wordsLabel: "Obsolete" }))
        expect(screen.getByTestId("preference-value").textContent).toMatch(/^en:default:.*:false$/)
        expect(document.documentElement.lang).toBe("en")
        expect(localStorage.getItem("kana-words-lang")).toBe("en")
    })
})

describe("translation failure ownership", () => {
    it("keeps the selected language on translation failure and ignores obsolete failures", async () => {
        const pending = new Map<Language, { resolve: (messages: Record<string, string>) => void; reject: (error: Error) => void }>()
        const loader = (lang: Language) => new Promise<Record<string, string>>((resolve, reject) => pending.set(lang, { resolve, reject }))
        render(<ThemeProvider><I18nProvider initialLang="en" translationLoader={loader}><Preferences /></I18nProvider></ThemeProvider>)
        act(() => screen.getByText("Spanish").click())
        act(() => screen.getByText("Japanese").click())
        await act(async () => pending.get("ja")!.resolve({ wordsLabel: "Japanese words" }))
        await act(async () => pending.get("es")!.reject(new Error("obsolete load")))
        expect(screen.getByTestId("preference-value").textContent).toBe("ja:default:Japanese words:false")
        act(() => screen.getByText("Spanish").click())
        await act(async () => pending.get("es")!.reject(new Error("load failed")))
        expect(screen.getByTestId("preference-value").textContent).toMatch(/^es:default:.*:false$/)
        expect(document.documentElement.lang).toBe("es")
        expect(localStorage.getItem("kana-words-lang")).toBe("es")
    })
})
