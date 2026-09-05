import type { Metadata } from "next"
import type { ReactNode } from "react"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Kanji Challenge — Readings & Meanings",
  descriptionKey: "seo.kanji.description",
  path: "/kanji",
  keywords: ["kanji quiz", "kanji readings", "JLPT kanji", "on'yomi", "kun'yomi"],
})

export default function KanjiLayout({ children }: { children: ReactNode }) {
  return children
}
