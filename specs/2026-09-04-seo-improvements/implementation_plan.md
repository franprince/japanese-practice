# Implementation Plan: Improve search and social metadata

- **Spec:** [spec.md](./spec.md)
- **Branch:** `feat/seo-improvements` from `develop`
- **Status:** Approved through implementation handoff

## Design

Create a server-safe SEO module that owns the canonical origin, application
name, shared Open Graph image, English description lookup, and a page metadata
factory. Root and page layouts consume it so URLs and social fields cannot
drift.

Keep translations in the existing JSON catalogs. English catalog values feed
server-rendered metadata today. Spanish and Japanese values are ready for a
future locale-routing feature; publishing alternate-language metadata without
distinct crawlable URLs is intentionally out of scope.

Use Next.js metadata routes for sitemap, robots, manifest, and Open Graph image
generation. Render a single static `WebApplication` JSON-LD script in the root
layout.

## Files

- `src/lib/seo.ts`: shared constants and page metadata factory.
- `app/layout.tsx`: expanded root metadata and JSON-LD wiring.
- `app/{words,kanji,numbers,dates}/layout.tsx`: unique page metadata.
- `app/sitemap.ts`: canonical indexable route list.
- `app/robots.ts`: crawl policy and sitemap discovery.
- `app/manifest.ts`: install metadata and icon.
- `app/opengraph-image.tsx`: generated 1200×630 social image.
- `src/components/seo/json-ld.tsx`: escaped structured data script.
- `src/locales/{en,es,ja}.json`: localized SEO descriptions.
- `specs/INDEX.md`: workflow record.

## Verification

1. Run `bun run typecheck`.
2. Run `bun run lint`.
3. Run `bun run test`.
4. Run `bun run build` and inspect generated metadata routes.
5. Review the complete diff against `develop` before committing.

## Commit boundaries

1. Spec, plan, task checklist, and index entry.
2. Metadata and localization implementation.
3. Discovery routes, social image, manifest, and structured data.
