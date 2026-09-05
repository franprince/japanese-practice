import { describe, expect, it, mock } from "bun:test"
import { fireEvent, render, screen } from "@testing-library/react"
import { I18nProvider } from "@/lib/i18n"
import type { CharacterGroup, WordFilter } from "@/types/japanese"
import { ModeSection } from "./mode-section"
import { SessionSection } from "./session-section"
import { FilterSection } from "./filter-section"

const groups: CharacterGroup[] = [
  { id: "a", label: "A", labelJp: "あ", type: "hiragana", characters: ["あ"] },
  { id: "ka", label: "Ka", labelJp: "か", type: "hiragana", characters: ["か"] },
  { id: "a-k", label: "A", labelJp: "ア", type: "katakana", characters: ["ア"] },
]
const initialFilter: WordFilter = { selectedGroups: ["a"], minLength: 3, maxLength: 6 }
function captureFilterUpdates() {
  let current = initialFilter
  const changes: WordFilter[] = []
  const onFilterChange: React.Dispatch<React.SetStateAction<WordFilter>> = action => {
    current = typeof action === "function" ? action(current) : action
    changes.push(current)
  }
  return { onFilterChange, changes }
}
const wrap = (children: React.ReactNode) => <I18nProvider initialLang="en">{children}</I18nProvider>

describe("settings sections", () => {
  it("emits controlled mode and game type changes", () => {
    const onModeChange = mock()
    const onGameTypeChange = mock()
    render(wrap(<ModeSection mode="hiragana" gameType="words" onModeChange={onModeChange} onGameTypeChange={onGameTypeChange} />))
    fireEvent.click(screen.getByRole("button", { name: /Custom/ }))
    fireEvent.click(screen.getByRole("button", { name: /Multiple choice/ }))
    expect(onModeChange).toHaveBeenCalledWith("custom")
    expect(onGameTypeChange).toHaveBeenCalledWith("guess")
  })

  it("emits session mode and target changes", () => {
    const onPlayModeChange = mock()
    const onTargetCountChange = mock()
    render(wrap(<SessionSection playMode="session" targetCount={10} onPlayModeChange={onPlayModeChange} onTargetCountChange={onTargetCountChange} />))
    fireEvent.click(screen.getByRole("button", { name: "Infinite" }))
    fireEvent.click(screen.getByRole("button", { name: "50" }))
    expect(onPlayModeChange).toHaveBeenCalledWith("infinite")
    expect(onTargetCountChange).toHaveBeenCalledWith(50)
  })

  it("emits copied filters for group and all/none controls", () => {
    const { onFilterChange, changes } = captureFilterUpdates()
    const ref = { current: null }
    render(wrap(<FilterSection mode="custom" gameType="characters" filter={initialFilter} characterGroups={groups} onFilterChange={onFilterChange} sectionRef={ref} />))
    fireEvent.click(screen.getByRole("button", { name: "か" }))
    const toggled = changes[0]!
    expect(toggled.selectedGroups).toEqual(["a", "ka"])
    expect(toggled).not.toBe(initialFilter)
    fireEvent.click(screen.getByRole("button", { name: "Deselect all" }))
    expect(changes[1]!.selectedGroups).toEqual([])
    fireEvent.click(screen.getByRole("button", { name: "Select all" }))
    expect(changes[2]!.selectedGroups).toEqual(["a", "ka", "a-k"])
  })

  it("emits a new length range when the real slider changes", () => {
    const { onFilterChange, changes } = captureFilterUpdates()
    const original = structuredClone(initialFilter)
    render(wrap(<FilterSection mode="custom" gameType="words" filter={initialFilter} characterGroups={groups} onFilterChange={onFilterChange} sectionRef={{ current: null }} />))
    const lower = screen.getAllByRole("slider")[0]!
    fireEvent.keyDown(lower, { key: "ArrowRight" })
    expect(changes).toEqual([{ ...initialFilter, minLength: 4, maxLength: 6 }])
    expect(initialFilter).toEqual(original)
  })

  it("shows length controls for words and characters but not Guess", () => {
    const ref = { current: null }
    const { rerender } = render(wrap(<FilterSection mode="custom" gameType="words" filter={initialFilter} characterGroups={groups} onFilterChange={mock()} sectionRef={ref} />))
    expect(screen.getByText("Word Length")).toBeTruthy()
    rerender(wrap(<FilterSection mode="custom" gameType="guess" filter={initialFilter} characterGroups={groups} onFilterChange={mock()} sectionRef={ref} />))
    expect(screen.queryByText("Word Length")).toBeNull()
    expect(screen.queryByText("Character Length")).toBeNull()
    rerender(wrap(<FilterSection mode="custom" gameType="characters" filter={initialFilter} characterGroups={groups} onFilterChange={mock()} sectionRef={ref} />))
    expect(screen.getByText("Character Length")).toBeTruthy()
  })
})
