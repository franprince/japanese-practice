import type { ReactNode } from "react"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = pageMetadata({
  title: "Text Analyzer — Furigana, Romaji and Translation",
  descriptionKey: "seo.reader.description",
  path: "/analyzer",
  keywords: ["furigana", "japanese reader", "japanese text analyzer", "romaji converter", "japanese lyrics translation", "kanji lookup"],
})

export default function ReaderLayout({ children }: { children: ReactNode }) {
  return children
}
