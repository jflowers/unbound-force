---
tag: convention-packs
author: jay-flowers
category: gotcha
created_at: 2026-10-14T22:02:56Z
identity: convention-packs-20261014T220256-jay-flowers
tier: draft
---

`.opencode/uf/packs/severity.md` defines only the spec-review auto-fix boundary (LOW/MEDIUM auto-fix, HIGH/CRITICAL report-only); the enumerated fix-scope list (formatting, status fields, terminology, cross-references, obvious gaps, stale metadata) is the review council command's "hybrid fix policy" (`.opencode/commands/uf.review-council.md` Spec Review Mode, ~lines 1172-1178). Commands that paraphrase that list must cite the council's hybrid fix policy, not severity.md — the unleash direct-review-dispatch increment (opsx/unleash-direct-review-dispatch, 2026-10-14) attributed the paraphrase to severity.md, sending editors to a pack that does not contain the list. When auditing normative citations, grep the enumerated phrases inside the cited pack (accounting for line-wrapping — search the final phrase of the list, e.g. "stale metadata", not the full sentence) to confirm the cited content actually resolves.
