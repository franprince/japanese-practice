import { afterEach, describe, expect, it, spyOn } from "bun:test"
import { act, renderHook } from "@testing-library/react"
import { useStoredPreference } from "../use-stored-preference"

const valid = (value: string | null): value is "en" | "es" => value === "en" || value === "es"
afterEach(() => localStorage.clear())

describe("stored preferences", () => {
    it("reads saved values without overwriting them and notifies other mounted consumers", () => {
        localStorage.setItem("test-preference", "es")
        const first = renderHook(() => useStoredPreference("test-preference", "en", valid))
        const second = renderHook(() => useStoredPreference("test-preference", "en", valid))
        expect(first.result.current[0]).toBe("es")
        expect(localStorage.getItem("test-preference")).toBe("es")
        act(() => first.result.current[1]("en"))
        expect(second.result.current[0]).toBe("en")
        act(() => {
            localStorage.setItem("test-preference", "es")
            window.dispatchEvent(new StorageEvent("storage", { key: "test-preference" }))
        })
        expect(first.result.current[0]).toBe("es")
        expect(second.result.current[0]).toBe("es")
    })
    it("uses the default for invalid storage and retains a selection if writes fail", () => {
        localStorage.setItem("test-preference", "invalid")
        const { result } = renderHook(() => useStoredPreference("test-preference", "en", valid))
        expect(result.current[0]).toBe("en")
        const write = spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("denied") })
        try {
            act(() => result.current[1]("es"))
            expect(result.current[0]).toBe("es")
        } finally { write.mockRestore() }
    })
})
