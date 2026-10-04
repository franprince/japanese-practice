# Implementation plan

Approved scope: update package.json and bun.lock for Next.js 16.3.8, eslint-config-next 16.3.8, and React/React DOM 19.2.8. Install in an isolated worktree so parallel fixes retain their existing dependency baseline.

Run the full existing checks against the upgraded runtime and lint rules; use the real browser suite as regression coverage for framework behavior. Document any compatibility adjustment needed by the upgrade. Publish as the first PR against develop. Subsequent fixes target their immediate predecessor and share the upgraded dependency tree for final verification.

Rollback: revert this dependency commit and reinstall from the restored lockfile.

## Compatibility verification

Next.js 16.3.8 adds `bfcacheId` to its router interface; the Words page test fixture supplies that field. The installed Bun 1.3.5 fails while loading the new framework's compiled CommonJS server module. The production build succeeds with an isolated Bun 1.4.2 binary. Pin CI/Docker to Bun 1.4.2, declare the verified minimum and package manager, and document the runtime requirement. The host runtime is unchanged.

## Final stacked verification

Verified on stack position 1/8 with Next.js 16.3.8, React 19.2.8, and Bun 1.4.2: typecheck, lint (zero errors, five existing warnings), feature boundaries, all 322 unit tests, production build, and 58 Chromium tests pass. The build and browser server use the actual cumulative branch contents. Position 1 reuses the full browser result from the identical security worktree.

The branch `fix/review-01-next-security` is prepared for a separate PR against `develop`. External publication/check state is recorded by GitHub.

## Vercel preview compatibility

Declaring only `engines.bun` made Vercel select the Bun function runtime (the log changed from Node 24.x to Bun 1.4.x), causing the health function bundle to exceed 150 MB. Declare `engines.node` as `22.x || 24.x` alongside the Bun requirement so Vercel selects Node for hosted functions while CI, Docker, and build tooling use Bun. This matches the existing Node 22 CI tooling and Node 24 hosting configuration. No hosting project settings or function tracing exclusions are changed.

Runtime selection is confirmed by [Vercel's implementation](https://github.com/vercel/vercel/blob/main/packages/build-utils/src/fs/run-user-scripts.ts). Re-run dependency installation, local quality gates, and Node production-server browser checks, then restack the seven dependent one-commit branches. GitHub records the new preview and CI results.

The corrected security branch passes frozen installation, typecheck, lint, feature boundaries, all 322 unit tests, production build, and all 58 browser tests against a Node 22 production server.
