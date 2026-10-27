import type { ReactNode } from "react"
import { pageMetadata } from "@/lib/seo"

export const generateMetadata = pageMetadata({
  title: "Numbers Challenge — Japanese Number Writing",
  descriptionKey: "seo.numbers.description",
  path: "/numbers",
  keywords: ["Japanese numbers", "kanji numbers", "Japanese number quiz", "number writing"],
})

export default function NumbersLayout({ children }: { children: ReactNode }) {
  return children
}
