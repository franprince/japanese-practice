# Static wordset artifacts

`bun run build`, `bun run dev`, and `bun run wordset:build` publish delivery
artifacts. `bun run wordset:publish` runs only publication. Source payloads are
`public/wordset-en.json` and `public/wordset-es.json`; their vocabulary and numeric
versions remain unchanged by publication. Both sources must be present and valid.

Generated `public/wordsets/` is ignored by Git. It contains:

- `<language>-<sha256>.json`: exact source bytes, SHA-256 named; immutable for one
  year (`public, max-age=31536000, immutable`).
- `manifest.json`: `schemaVersion: 1`, `datasets.en` and `datasets.es`, each with
  `language`, numeric `version`, uncompressed `bytes`, lowercase SHA-256 `checksum`,
  and same-origin `url`. It uses `Cache-Control: no-cache` so browser/CDN caches
  revalidate rather than retaining stale metadata. Static hosting supplies ETags
  and conditional 304 responses; browser fetch resolves these to the cached body.

The generator validates both sources first, writes assets, then atomically replaces
the manifest. Identical inputs yield identical assets and manifest. Any byte
change produces a new URL even if someone forgets to increment the numeric version.

The client validates all metadata, streams the selected asset, verifies decoded
byte size and checksum, and validates payload version and every word before the
existing durable-cache lifecycle runs. Checksum metadata is stored alongside the
cached dataset without changing the IndexedDB version. Older cache entries remain
usable while desktop refreshes once; mobile offers an update under the existing
consent policy. Later visits check only the manifest when the checksum matches.
Japanese uses the English dataset. Mobile prompts read size from the manifest;
metadata failures retain the advisory estimate and never authorize a download.

## Deployment

Run the normal build before publishing and deploy the entire generated `public/`
with the application. The existing Docker build copies it from the builder into
the standalone runner. On another static host, reproduce the two cache rules in
`next.config.mjs`. Do not serve the manifest with immutable caching.

Deploy manifest and assets together atomically. For a shared CDN/bucket updated
in place, upload assets first, replace the manifest last, and retain previous
hashed assets for at least the supported old-client lifetime. The generator does
not delete old hashes in an existing directory. A clean build contains only its
current hashes; a host replacing the entire deployment may return 404 to a client
holding older metadata. Such failures remain explicit and retry re-fetches the
manifest; cached wordsets stay usable. Never overwrite different bytes at a
published hash URL. Roll back by restoring a complete previous deployment.

New clients no longer use `/api/wordset`; the route is removed. Already-open tabs
running the old application must reload after deployment to acquire or refresh
wordsets. Their existing durable cache remains available.

## Verification

Run `bun run test:unit`, `bun run typecheck`, `bun run lint`, and `bun run build`.
Then run the production browser and HTTP checks:

```sh
node node_modules/@playwright/test/cli.js test e2e/tests/words.spec.ts e2e/tests/wordset-lifecycle.spec.ts e2e/tests/static-wordset-delivery.spec.ts --config=playwright.production.config.ts --workers=2
```

The production config starts the built application on port 3016. Tests cover
real English/Spanish downloads, durable cache reuse after reload, mobile failure,
retry and cancellation, immutable headers, manifest ETag/304, and missing assets.
The same HTTP tests also run with the default development configuration.
