import type { ReactNode } from "react"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = pageMetadata({
  title: "Kanji Challenge — Readings & Meanings",
  descriptionKey: "seo.kanji.description",
  path: "/kanji",
  keywords: ["kanji quiz", "kanji readings", "JLPT kanji", "on'yomi", "kun'yomi"],
})

export default function KanjiLayout({ children }: { children: ReactNode }) {
  return children
}
