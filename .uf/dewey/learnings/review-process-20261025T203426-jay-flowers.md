---
tag: review-process
author: jay-flowers
category: gotcha
created_at: 2026-10-25T20:34:26Z
identity: review-process-20261025T203426-jay-flowers
tier: draft
---

A learning shipped inside the same PR that describes a defect in the present tense ("still reads", "missed") is evidence the documented fix was never applied — cross-check such learnings against the PR's diff line accounting before treating the knowledge as captured-and-remediated. Verified on PR 829 (unbound-force/unbound-force, quick/fix-push-state-catch-to-zero, 2026-10-25): the seam-verification learning stated golden-output-shape.test.ts:1020 still read [uf.finale.md:349] while the updated census comment said 357, and the diff's +5/-5 for that file accounted for exactly the comment plus three of the four shifted test-name annotations — the one-line annotation fix was captured as knowledge but skipped as code. Recipe: when a PR both adds learnings and shifts numbered annotations, sum the diff's changed-line count and compare it against the full set of references that must move; a present-tense defect description plus an exhausted diff budget means the fix was recorded but not applied.
