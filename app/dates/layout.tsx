import type { Metadata } from "next"
import type { ReactNode } from "react"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Dates Challenge — Japanese Date Readings",
  descriptionKey: "seo.dates.description",
  path: "/dates",
  keywords: ["Japanese dates", "Japanese weekdays", "Japanese months", "date readings"],
})

export default function DatesLayout({ children }: { children: ReactNode }) {
  return children
}
