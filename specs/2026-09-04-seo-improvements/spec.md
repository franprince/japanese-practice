# Spec: Improve search and social metadata

- **Date:** 2026-09-04
- **Slug:** `seo-improvements`
- **Status:** Approved through implementation handoff

## Problem statement

The application exposes only a generic title and description. Search engines
and social platforms cannot reliably discover its canonical pages, preview
them with a branded image, or understand the application through structured
data. The multilingual interface also has no translated SEO descriptions in
its translation catalogs.

## Goals

1. Publish complete root metadata for search engines and social previews.
2. Publish distinct metadata for the words, kanji, numbers, and dates pages.
3. Expose stable sitemap, robots, web manifest, and Open Graph image routes.
4. Describe the site as a free multilingual educational web application with
   JSON-LD.
5. Add equivalent SEO descriptions to the English, Spanish, and Japanese
   translation catalogs.
6. Keep canonical URLs and shared branding consistent from one source.

## Non-goals

- Add locale-prefixed URLs or `hreflang` links.
- Change the client-side language preference mechanism.
- Add analytics, paid SEO tooling, or keyword-tracking integrations.
- Redesign application pages.

## Inputs and outputs

- The canonical production origin is `https://www.nihongo-renshuu.app`.
- Public indexable routes are `/`, `/words`, `/kanji`, `/numbers`, and
  `/dates`.
- Private implementation routes under `/api/` and the experimental Ollama
  practice page remain excluded from crawling.
- Metadata outputs use Next.js metadata route and `Metadata` types.

## Edge cases

- Child page Open Graph metadata must repeat shared image and site fields
  because nested Next.js metadata objects replace, rather than deeply merge,
  parent fields.
- Sitemap responses must not claim every page changed whenever requested.
- Structured JSON must escape `<` so future dynamic copy cannot terminate the
  script element.
- Localized descriptions remain translation resources until the application
  has crawlable locale-specific URLs.

## Acceptance criteria

- Root metadata includes `metadataBase`, title, description, keywords,
  canonical URL, Open Graph, Twitter, and crawler directives.
- Each public game page has a unique title, description, canonical URL, and
  complete social preview metadata.
- `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, and
  `/opengraph-image` build successfully.
- The root layout renders valid `WebApplication` JSON-LD.
- All three locale files define descriptions for home, words, kanji, numbers,
  and dates.
- Typecheck, lint, unit tests, and production build pass.
