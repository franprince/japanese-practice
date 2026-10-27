import type { ReactNode } from "react"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = pageMetadata({
  title: "Reader — Furigana, Romaji and Translation",
  descriptionKey: "seo.reader.description",
  path: "/reader",
  keywords: ["furigana", "japanese reader", "romaji converter", "japanese lyrics translation", "kanji lookup"],
})

export default function ReaderLayout({ children }: { children: ReactNode }) {
  return children
}
