import React from "react";
import { describe, it, expect } from "bun:test";
import { render } from "@testing-library/react";
import { FuriganaText } from "./furigana-text";

describe("FuriganaText", () => {
  it("renders a ruby element for a standard kanji+reading pair", () => {
    const { container } = render(<FuriganaText text="学生[がくせい]" />);
    const ruby = container.querySelector("ruby");
    expect(ruby).not.toBeNull();
    expect(ruby?.textContent).toContain("学生");
    expect(container.querySelector("rt")?.textContent).toBe("がくせい");
  });

  it("renders a ruby element when the base word or reading contains a chōonpu (ー)", () => {
    // Sourced from curriculum.ts:52 — this previously failed to match at all
    // because the character classes excluded U+30FC.
    const { container } = render(
      <FuriganaText text="エレベーター[えれべーたー] は あそこ です。" />
    );
    const ruby = container.querySelector("ruby");
    expect(ruby).not.toBeNull();
    expect(ruby?.textContent).toContain("エレベーター");
    expect(container.querySelector("rt")?.textContent).toBe("えれべーたー");
  });

  it("falls back to plain text when there is no bracketed reading", () => {
    const { container } = render(<FuriganaText text="hello world" />);
    expect(container.querySelector("ruby")).toBeNull();
    expect(container.textContent).toBe("hello world");
  });
});
