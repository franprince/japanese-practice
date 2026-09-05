import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

const routes = [
  { path: "", priority: 1 },
  { path: "/words", priority: 0.9 },
  { path: "/kanji", priority: 0.9 },
  { path: "/numbers", priority: 0.8 },
  { path: "/dates", priority: 0.8 },
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority,
  }))
}
