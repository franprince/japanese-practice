# Custom script sampling

Status: Approved

## Authorization

The user requested every reviewed fix in a separate, stackable PR and authorized the scope, specification, plan, and implementation on 2026-10-03. No optional spec roast was requested; the approved implementation plan skips that offer.

## Problem and outcome

Custom Characters and Guess ignore selected Katakana groups when Hiragana groups are also selected. Custom sampling must include every selected script. Single-script selections and existing Both sampling remain supported.

## Scope and acceptance

- Sample selected Hiragana and Katakana groups in Custom, for both Characters and Guess.
- Preserve group filtering, generated length, metadata, and special-group sampling.
- Keep explicit subject/filter ownership in the separate word-filter-scope fix.
- Verify mixed and single-script generation with regressions and browser coverage.
