# Practice UX refactor

Status: Approved for implementation by the user's “Plan it, do it” instruction following the UI assessment.

## Problem
Oversized practice layouts obscure actions, Words hides mobile progress and overlays mistakes, settings differ across games, light themes lack tokens, and session summaries offer no focused review. Home cards hide descriptions and do not guide beginners.

## Goals and acceptance criteria
1. All four games share a compact header, visible question progress, active configuration, and a labeled settings trigger at desktop and mobile widths. No floating toolbar covers content.
2. One responsive, accessible settings shell owns draft/apply/cancel behavior. Changed settings explicitly warn that they restart the session; cancel and unchanged saves preserve progress. Words exposes filters only when Custom is selected. All selection states are accessible.
3. Prompts, inputs, feedback and next actions are readable, responsive and keyboard operable. Inputs have persistent labels, feedback is announced, motion respects user preference, and dialogs suppress game shortcuts.
4. Every offered theme defines readable surfaces and semantic colors. Preserve theme/language storage and download consent.
5. Home cards always show descriptions and examples; titles match their pages. Offer a beginner preset and remember the last applied practice configuration for a repeat visit, without implying a paused session resumes.
6. Each game records unique incorrect/skipped questions during a session and can start a finite review containing only those questions. Review can itself be reviewed. Ordinary restart/settings changes clear the queue and restore ordinary practice. Existing scoring stays unchanged.
7. All new copy exists in English, Spanish and Japanese. App builds, typechecks, passes lint/boundary checks and meaningful unit/browser coverage.

## Contracts
Session review uses a generic typed question queue separate from the existing scoring reducer; callbacks only record admitted answers. Preferences store versioned, validated configuration, never answers or unfinished progress. Existing routes and public Japanese module boundaries remain intact.

## Edge cases
Empty review queue hides review action; repeated misses deduplicate; last-question mistakes are included; rapid submission admits one outcome; configuration changes reset review; unavailable vocabulary retains explicit acquisition/consent UI; loading/errors offer readable states. Long kana/romaji and translations wrap without horizontal clipping. Reduced height and virtual keyboards allow normal scrolling.

## Non-goals
New games, accounts, remote analytics, spaced repetition, vocabulary schema or acquisition rewrites, changes to scoring, and merging PRs. The task started on the module-extraction prerequisite from PR #62. That PR merged during implementation; the feature branch was fast-forwarded to develop at 3371dd2, whose tree matched the starting implementation.
