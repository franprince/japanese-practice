# Patch framework security dependencies

Status: Approved for implementation by the user on 2026-10-03 as one of eight reviewed fixes, each delivered in its own stacked PR.

Next.js 16.0.10 falls within the published CVE-2026-23864 affected versions. Upgrade Next.js and its lint configuration to the current supported security release, 16.3.8, and React/React DOM to matching patched 19.2.8 releases. Use the verified Bun 1.4.2 runtime baseline in CI, Docker, and package metadata. Preserve the app version and existing features. No application redesign or unrelated dependency upgrades.

Acceptance: frozen-lockfile installation succeeds; typecheck, lint, unit tests, feature boundaries, production build, and the full Chromium suite pass. App routes, static vocabulary headers, hydration, and saved settings remain usable.

Sources: [Next.js advisory](https://github.com/vercel/next.js/security/advisories/GHSA-h25m-26qc-wcjf), [September security release](https://nextjs.org/blog/september-2026-security-release). Exact versions and compatibility were verified in the npm registry.

## Authorization

The user explicitly requested implementation and separate stackable PRs for every reviewed issue. This is delivery of that approved scope, with no new feature design or optional refinement stage.

Hosted functions must retain the Node runtime; declaring Bun tooling must not opt Vercel into the Bun function runtime. Support Node 22 and 24 alongside Bun 1.4.2 or newer.
