# Implementation plan

1. Branch release/3.6.0 from develop and merge main release metadata.
2. Confirm expected version with the configured commit analyzer without publishing; refresh README and GitHub About description.
3. Verify typecheck, lint, unit tests, production build, feature boundaries and browser flows; reuse applicable before/after and successful-flow screenshots.
4. Push the release branch, open the PR against main, and check mergeability. Include rollout/rollback guidance; do not merge or run release publication.

All spec acceptance criteria map to these four steps. Main is at v3.5.0; commit analysis selects a minor release, expected v3.6.0. The release workflow will set the final version on main.

## Validation

- Typecheck, feature boundaries and production build passed.
- 322 unit tests and 58 production Chromium tests passed on the release candidate.
- Lint: zero errors, five existing warnings.
- Configured commit analyzer: minor release since v3.5.0, expected v3.6.0.
- GitHub About description updated and read back successfully.
- Existing before/after and 18 successful-flow captures remain applicable: application source is unchanged from the merged UX branch.
