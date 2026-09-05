import { describe, expect, it, spyOn } from "bun:test"
import { StrictMode } from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import WordsPage from "../../../app/words/page"
import { I18nProvider } from "@/lib/i18n"
import { ThemeProvider } from "@/lib/theme"
import * as shared from "@/lib/japanese/shared"
import * as words from "@/lib/japanese/words"
import type { CharacterGroup } from "@/types/japanese"
import { fixtureManifest } from "@/test/wordset-fixture"

const groups: CharacterGroup[] = [{ id: "vowels", label: "Vowels", labelJp: "あ", type: "hiragana", characters: ["あ"] }]
const ui = <StrictMode><ThemeProvider><I18nProvider initialLang="en"><WordsPage /></I18nProvider></ThemeProvider></StrictMode>

describe("Words filter initialization", () => {
    for (const applyBeforeLoad of [false, true]) {
        it(`loads current groups without overwriting an applied filter (${applyBeforeLoad})`, async () => {
            const pending: ((groups: CharacterGroup[]) => void)[] = []
            const load = spyOn(shared, "getCharacterGroups").mockImplementation(() => new Promise(resolve => pending.push(resolve)))
            const getWord = spyOn(words, "getRandomWord").mockResolvedValue({ kana: "あいう", romaji: "aiu", type: "hiragana", groups: [] })
            const fetcher = spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(fixtureManifest({ version: 1 }))))
            const originalScroll = HTMLElement.prototype.scrollIntoView
            HTMLElement.prototype.scrollIntoView = () => {}
            try {
                const { unmount } = render(ui)
                expect(pending).toHaveLength(2)
                if (applyBeforeLoad) {
                    fireEvent.click(screen.getByTestId("settings-trigger"))
                    fireEvent.click(screen.getByRole("button", { name: "20" }))
                    fireEvent.click(screen.getByRole("button", { name: "Save Settings" }))
                }
                await act(async () => pending[1]!(groups))
                await act(async () => pending[0]!([{ ...groups[0]!, id: "obsolete", label: "Obsolete" }]))
                fireEvent.click(screen.getByTestId("settings-trigger"))
                fireEvent.click(screen.getByRole("button", { name: /Custom/ }))
                expect(screen.queryByText("Obsolete")).toBeNull()
                const save = screen.getByRole("button", { name: "Save Settings" })
                if (applyBeforeLoad) expect(save).toBeDisabled()
                else expect(save).toBeEnabled()
                unmount()
            } finally {
                load.mockRestore(); getWord.mockRestore(); fetcher.mockRestore()
                HTMLElement.prototype.scrollIntoView = originalScroll
            }
        })
    }
})
