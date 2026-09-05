import { describe, expect, test } from "bun:test"
import en from "@/locales/en.json"
import es from "@/locales/es.json"
import ja from "@/locales/ja.json"
import {
  OG_IMAGE,
  SITE_NAME,
  createPageMetadata,
} from "@/lib/seo"

const descriptionKeys = [
  "seo.home.description",
  "seo.words.description",
  "seo.kanji.description",
  "seo.numbers.description",
  "seo.dates.description",
] as const

describe("SEO metadata", () => {
  test("creates complete page and social metadata", () => {
    const metadata = createPageMetadata({
      title: "Words Practice",
      descriptionKey: "seo.words.description",
      path: "/words",
      keywords: ["kana words"],
    })

    expect(metadata).toMatchObject({
      title: "Words Practice",
      description: en["seo.words.description"],
      alternates: { canonical: "/words" },
      openGraph: {
        type: "website",
        url: "/words",
        siteName: SITE_NAME,
        images: [OG_IMAGE],
      },
      twitter: {
        card: "summary_large_image",
        images: [OG_IMAGE.url],
      },
    })
  })

  test("keeps SEO descriptions available in every supported locale", () => {
    for (const key of descriptionKeys) {
      expect(en[key].length).toBeGreaterThan(40)
      expect(es[key].length).toBeGreaterThan(40)
      expect(ja[key].length).toBeGreaterThan(20)
    }
  })
})
