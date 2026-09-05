import { describe, expect, it, mock } from "bun:test"
import { render, act } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { hydrateRoot, type Root } from "react-dom/client"
import { NumberPad } from "./number-pad"
import { I18nProvider } from "@/lib/i18n"
import { numberPadKeysArabic, numberPadKeysKanji } from "@/lib/japanese/numbers"

const events = { onKeyPress: mock(), onDelete: mock(), onClear: mock(), onSubmit: mock() }
function Pad({ shuffled = true, disabled = false, keys = numberPadKeysKanji }: { shuffled?: boolean; disabled?: boolean; keys?: typeof numberPadKeysKanji | typeof numberPadKeysArabic }) {
    return <I18nProvider initialLang="en"><NumberPad {...events} shuffleNumbers={shuffled} disabled={disabled} keys={keys} /></I18nProvider>
}
function order(container: HTMLElement) {
    return Array.from(container.querySelectorAll("#number-pad button")).map(button => button.textContent)
}
describe("keypad lifecycle", () => {
    it("keeps order across input, disabled changes and equal key arrays; restores ordered keys", () => {
        const { container, rerender } = render(<Pad />)
        const initial = order(container)
        expect([...initial].sort()).toEqual(numberPadKeysKanji.map(key => key.char).sort())
        act(() => (container.querySelector("#number-pad button") as HTMLButtonElement).click())
        rerender(<Pad disabled />)
        expect(order(container)).toEqual(initial)
        rerender(<Pad keys={[...numberPadKeysKanji]} />)
        expect(order(container)).toEqual(initial)
        rerender(<Pad shuffled={false} />)
        expect(order(container)).toEqual(numberPadKeysKanji.map(key => key.char))
        rerender(<Pad keys={numberPadKeysArabic} shuffled={false} />)
        expect(order(container)).toEqual(numberPadKeysArabic.map(key => key.char))
        rerender(<Pad />)
        expect(order(container).slice().sort()).toEqual([...initial].sort())
    })
    it("hydrates a shuffled pad without replacing the server markup", async () => {
        const ui = <Pad />
        const container = document.createElement("div")
        container.innerHTML = renderToString(ui)
        // happy-dom 20 leaves numeric quote and greater-than entities in class
        // attributes. Decode these as Chromium does before testing hydration.
        for (const node of Array.from(container.querySelectorAll("[class]"))) {
            node.setAttribute("class", node.getAttribute("class")!.replaceAll("&#x27;", "'").replaceAll("&gt;", ">"))
        }
        expect(order(container)).toEqual(numberPadKeysKanji.map(key => key.char))
        document.body.appendChild(container)
        const errors: unknown[] = []
        let root!: Root
        try {
            await act(async () => { root = hydrateRoot(container, ui, { onRecoverableError: error => errors.push(error) }) })
            expect(errors).toEqual([])
            expect(order(container).slice().sort()).toEqual(numberPadKeysKanji.map(key => key.char).sort())
        } finally {
            act(() => root?.unmount())
            container.remove()
        }
    })
})
