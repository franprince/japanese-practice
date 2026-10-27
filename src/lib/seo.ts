import type { Metadata, ResolvingMetadata } from "next"
import en from "@/locales/en.json"

export const SITE_URL = "https://www.nihongo-renshuu.app"
export const SITE_NAME = "Nihongo Renshū"
export const DEFAULT_TITLE = `${SITE_NAME} | 日本語 練習 — Japanese Practice App`
export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — A little Japanese, every day. Japanese practice notebook.`,
}

/** Notebook theme palette (see `[data-theme^="notebook"]` in app/globals.css) for assets rendered outside CSS. */
export const NOTEBOOK = {
  paper: "#f5f1e6",
  card: "#fffdf8",
  ink: "#22201c",
  muted: "#5c564c",
  red: "#b5371f",
  border: "#ddd6c7",
} as const

type SeoDescriptionKey =
  | "seo.home.description"
  | "seo.words.description"
  | "seo.kanji.description"
  | "seo.numbers.description"
  | "seo.dates.description"
  | "seo.reader.description"

interface PageMetadataOptions {
  title: string
  descriptionKey: SeoDescriptionKey
  path: `/${string}`
  keywords: string[]
}

export const HOME_DESCRIPTION = en["seo.home.description"]

type OpenGraphImages = NonNullable<NonNullable<Metadata["openGraph"]>["images"]>

/**
 * `images` defaults to the root OG image; pages pass the parent's resolved images instead (see
 * `pageMetadata`). Twitter has no images of its own, so Next copies the Open Graph ones.
 */
export function createPageMetadata(
  { title, descriptionKey, path, keywords }: PageMetadataOptions,
  images: OpenGraphImages = [OG_IMAGE],
): Metadata {
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
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
  }
}

/**
 * `generateMetadata` for a route layout. It reuses the root's file-based OG image URL, which carries
 * a content hash (`/opengraph-image?<hash>`), so social caches such as X's refetch when it changes.
 */
export function pageMetadata(options: PageMetadataOptions) {
  return async (_props: unknown, parent: ResolvingMetadata): Promise<Metadata> => {
    const { openGraph } = await parent
    return createPageMetadata(options, openGraph?.images ?? [OG_IMAGE])
  }
}
