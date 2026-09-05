import type { Metadata } from "next"
import en from "@/locales/en.json"

export const SITE_URL = "https://www.nihongo-renshuu.app"
export const SITE_NAME = "Nihongo Renshū"
export const DEFAULT_TITLE = `${SITE_NAME} | 日本語 練習 — Japanese Practice App`
export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — Japanese Practice App`,
}

type SeoDescriptionKey =
  | "seo.home.description"
  | "seo.words.description"
  | "seo.kanji.description"
  | "seo.numbers.description"
  | "seo.dates.description"

interface PageMetadataOptions {
  title: string
  descriptionKey: SeoDescriptionKey
  path: `/${string}`
  keywords: string[]
}

export const HOME_DESCRIPTION = en["seo.home.description"]

export function createPageMetadata({
  title,
  descriptionKey,
  path,
  keywords,
}: PageMetadataOptions): Metadata {
  const description = en[descriptionKey]
  const socialTitle = `${title} | ${SITE_NAME}`

  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: path,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [OG_IMAGE.url],
    },
  }
}
