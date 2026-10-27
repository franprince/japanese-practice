import { describe, expect, test } from "bun:test"
import en from "@/locales/en.json"
import es from "@/locales/es.json"
import ja from "@/locales/ja.json"
import {
  OG_IMAGE,
  SITE_NAME,
  createPageMetadata,
  pageMetadata,
} from "@/lib/seo"
import type { ResolvedMetadata } from "next"

const descriptionKeys = [
  "seo.home.description",
  "seo.words.description",
  "seo.kanji.description",
  "seo.numbers.description",
  "seo.dates.description",
  "seo.reader.description",
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
      },
    })
    // Next copies the Open Graph images into Twitter, keeping the hashed URL.
    expect(metadata.twitter).not.toHaveProperty("images")
  })

  test("reuses the parent's hashed OG image for route pages", async () => {
    const hashed = [{ url: new URL("https://example.com/opengraph-image?abc123") }]
    const parent = Promise.resolve({ openGraph: { images: hashed } } as unknown as ResolvedMetadata)
    const metadata = await pageMetadata({
      title: "Reader",
      descriptionKey: "seo.reader.description",
      path: "/reader",
      keywords: [],
    })({}, parent)

    expect(metadata.openGraph?.images).toBe(hashed)
  })

  test("keeps SEO descriptions available in every supported locale", () => {
    for (const key of descriptionKeys) {
      expect(en[key].length).toBeGreaterThan(40)
      expect(es[key].length).toBeGreaterThan(40)
      expect(ja[key].length).toBeGreaterThan(20)
    }
  })
})
