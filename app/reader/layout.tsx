import type { Metadata } from "next"
import type { ReactNode } from "react"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Reader — Furigana, Romaji and Translation",
  descriptionKey: "seo.reader.description",
  path: "/reader",
  keywords: ["furigana", "japanese reader", "romaji converter", "japanese lyrics translation", "kanji lookup"],
})

export default function ReaderLayout({ children }: { children: ReactNode }) {
  return children
}
