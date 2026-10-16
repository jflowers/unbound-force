---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-15T21:18:05Z
identity: uf-unleash-20261015T211805-jay-flowers
tier: draft
---

Task 3.2 of unleash-deterministic-tools (uf.unleash.md ceremony removal): the delegation prompt's line numbers for the two review-step blockquote pairs were swapped relative to file content — it labeled L413/L751 as the step-completion blockquotes to remove and L448/L804 as the iteration checkpoints to preserve, but reading the file shows the inverse: the INDENTED blockquotes recording `data: '{"iteration": N}'` (L413/L751, inside the fix-loop prose) are the review-loop ITERATION checkpoints, and the unindented "Proceed immediately to Step 7/9" ones (L448/L804) are the step-completion transitions. Resolution rule: when a delegation prompt's parenthetical line numbers conflict with its content descriptions, the content descriptions plus the spec/design/tasks.md verbatim text are authoritative — the prompt itself said "verify by reading context/content". Both pairs satisfy the "exactly 2 grep matches" check, so only content disambiguates. The preserved pair sits inside the REQUEST CHANGES fix-loop bullets (indented, iteration data); the removed pair sits at end-of-step before the next section header (unindented, carries the transition). Also: the demo blockquote bundles the completion `clear_progress` call with its CHECKPOINT ceremony — only the CHECKPOINT sentence is removed; the clear_progress instruction stays (its leading "Then" is dropped because the antecedent checkpoint sentence is gone).
