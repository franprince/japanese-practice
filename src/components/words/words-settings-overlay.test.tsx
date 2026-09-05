import { describe, expect, it, mock } from "bun:test"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { WordsSettingsOverlay } from "./words-settings-overlay"
import { I18nProvider } from "@/lib/i18n"
import type { CharacterGroup } from "@/lib/japanese/words"

const filter = { selectedGroups: ["a"], minLength: 3, maxLength: 6 }
const groups: CharacterGroup[] = [{ id: "a", label: "Vowels", labelJp: "母音", type: "hiragana", characters: ["あ"] }]
const base = { mode: "hiragana" as const, gameType: "characters" as const, playMode: "session" as const, targetCount: 10, filter, characterGroups: groups }

describe("Words settings drafts", () => {
    it("composes batched group and length changes in the same draft", () => {
        const apply = mock()
        const available = [...groups, { ...groups[0]!, id: "b", characters: ["い"] }]
        render(<I18nProvider initialLang="en"><WordsSettingsOverlay {...base} mode="custom" filter={{ ...filter, selectedGroups: [] }} characterGroups={available} open onOpenChange={mock()} onApply={apply} /></I18nProvider>)
        act(() => {
            screen.getByRole("button", { name: "あ" }).click()
            screen.getByRole("button", { name: "い" }).click()
            screen.getByRole("button", { name: "Any" }).click()
        })
        fireEvent.click(screen.getByRole("button", { name: "Save Settings" }))
        expect(apply).toHaveBeenCalledWith("custom", "characters", "session", 10, {
            selectedGroups: ["a", "b"], minLength: 1, maxLength: 100,
        })
    })
    it("preserves group toggles and emits a copied filter", () => {
        const apply = mock()
        const customFilter = { ...filter, selectedGroups: [] }
        render(<I18nProvider initialLang="en"><WordsSettingsOverlay {...base} mode="custom" filter={customFilter} open onOpenChange={mock()} onApply={apply} /></I18nProvider>)

        fireEvent.click(screen.getByRole("button", { name: "あ" }))
        fireEvent.click(screen.getByRole("button", { name: "Save Settings" }))

        expect(apply).toHaveBeenCalledWith("custom", "characters", "session", 10, { ...filter })
        expect(apply.mock.calls[0]?.[4]).not.toBe(filter)
    })

    it("keeps session targets and length presets in the draft", () => {
        const apply = mock()
        render(<I18nProvider initialLang="en"><WordsSettingsOverlay {...base} mode="custom" open onOpenChange={mock()} onApply={apply} /></I18nProvider>)

        fireEvent.click(screen.getByRole("button", { name: "Infinite" }))
        fireEvent.click(screen.getByRole("button", { name: "Any" }))
        fireEvent.click(screen.getByRole("button", { name: "Save Settings" }))

        expect(apply).toHaveBeenCalledWith("custom", "characters", "infinite", 10, { ...filter, minLength: 1, maxLength: 100 })
    })

    it("hides length controls for Guess while retaining session controls", () => {
        render(<I18nProvider initialLang="en"><WordsSettingsOverlay {...base} open onOpenChange={mock()} onApply={mock()} /></I18nProvider>)

        fireEvent.click(screen.getByRole("button", { name: /multiple choice/i }))

        expect(screen.queryByText("Character Length")).toBeNull()
        expect(screen.queryByRole("button", { name: "Infinite" })).toBeTruthy()
        expect(screen.queryByRole("button", { name: "Session" })).toBeTruthy()
    })

    it("keeps open edits across prop/group updates and applies one draft", () => {
        const apply = mock()
        const close = mock()
        const ui = (characterGroups: CharacterGroup[]) => <I18nProvider initialLang="en"><WordsSettingsOverlay {...base} open onOpenChange={close} onApply={apply} characterGroups={characterGroups} /></I18nProvider>
        const { rerender } = render(ui([]))
        fireEvent.click(screen.getByRole("button", { name: "20" }))
        rerender(ui(groups))
        fireEvent.click(screen.getByRole("button", { name: "Save Settings" }))
        expect(apply).toHaveBeenCalledTimes(1)
        expect(apply).toHaveBeenCalledWith("hiragana", "characters", "session", 20, filter)
        expect(close).toHaveBeenCalledWith(false)
    })
    it("discards a closed draft and initializes the next opening with the latest committed settings", () => {
        const apply = mock()
        const ui = (open: boolean, targetCount: number) => <I18nProvider initialLang="en"><WordsSettingsOverlay {...base} open={open} targetCount={targetCount} onOpenChange={mock()} onApply={apply} /></I18nProvider>
        const { rerender } = render(ui(true, 10))
        fireEvent.click(screen.getByRole("button", { name: "50" }))
        rerender(ui(false, 10))
        expect(screen.queryByRole("dialog")).toBeNull()
        expect(apply).not.toHaveBeenCalled()
        rerender(ui(true, 5))
        fireEvent.click(screen.getByRole("button", { name: "Save Settings" }))
        expect(apply).toHaveBeenCalledWith("hiragana", "characters", "session", 5, filter)
    })
    it("scrolls only when Custom is selected and retains filter edits", () => {
        const original = HTMLElement.prototype.scrollIntoView
        const scroll = mock()
        HTMLElement.prototype.scrollIntoView = scroll
        try {
            const apply = mock()
            render(<I18nProvider initialLang="en"><WordsSettingsOverlay {...base} open onOpenChange={mock()} onApply={apply} /></I18nProvider>)
            fireEvent.click(screen.getByRole("button", { name: /custom/i }))
            expect(scroll).toHaveBeenCalledTimes(1)
            fireEvent.click(screen.getByRole("button", { name: /deselect all/i }))
            expect(screen.getByRole("button", { name: "Save Settings" })).toBeDisabled()
            fireEvent.click(screen.getByRole("button", { name: "Select all" }))
            fireEvent.click(screen.getByRole("button", { name: "Any" }))
            act(() => screen.getByRole("button", { name: "Save Settings" }).click())
            expect(apply).toHaveBeenCalledWith("custom", "characters", "session", 10, { ...filter, minLength: 1, maxLength: 100 })
            expect(scroll).toHaveBeenCalledTimes(1)
        } finally { HTMLElement.prototype.scrollIntoView = original }
    })
})
