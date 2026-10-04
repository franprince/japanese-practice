# Preserve Spanish meanings during kanji rebuilds

Status: Approved for implementation by the user's request to fix each reviewed finding in a separate stackable PR, in parallel.

## Problem

The kanji builder reuses previous English meanings, readings, and JLPT levels, but loses previous Spanish meanings that are absent from the source dictionary. Review reproduction lost 237 existing translations, including `聞: escuchar` and `売: vender`.

## Goals and acceptance criteria

1. Retain a previous nonempty Spanish meaning when the Spanish source dictionary has none.
2. Preserve current precedence: a source Spanish meaning wins over a previous Spanish meaning.
3. Keep existing English, reading, and JLPT fallback behavior and versioned output unchanged.
4. Cover preservation, source precedence, empty previous meanings, and absent translations with a small isolated builder regression included in `bun test src`, with external requests blocked.

## Non-goals

Regenerating or editing published datasets, changing enrichment requests or JLPT classification, changing publication/splitting, and modifying shared roadmap files.

## Authorization and refinement

The user's current explicit fix-and-PR request approves this reviewed scope, its implementation plan, and execution. The approved scope and plan need no additional refinement checkpoint.
