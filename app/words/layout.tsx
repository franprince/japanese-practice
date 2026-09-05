import type { Metadata } from "next"
import type { ReactNode } from "react"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Words Practice — Kana Romaji Drills",
  descriptionKey: "seo.words.description",
  path: "/words",
  keywords: ["kana words", "hiragana practice", "katakana practice", "romaji quiz"],
})

export default function WordsLayout({ children }: { children: ReactNode }) {
  return children
}
