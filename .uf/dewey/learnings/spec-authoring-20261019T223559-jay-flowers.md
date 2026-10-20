---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-19T22:35:59Z
identity: spec-authoring-20261019T223559-jay-flowers
tier: draft
---

When authoring an OpenSpec/Speckit delta that claims a coverage gap ("currently unpinned", "nothing executes X"), verify the claim against the current base commit by reading the cited test files in full — not just the spans or files referenced in prior issues. Landed changes can already deliver the coverage a new change proposes to add, making a task layer a no-op and its falsification premise false. Concrete case (unbound-force, issue #765): the seam-verification change proposed task 3.3 to add Step 10 persistence pins in scaffold_test.go that already existed at base (scaffold_test.go:182 extracts the stepTenPersistence span; 219-246 pin write_unleash_summary presence, named params including review_verdicts/learnings_stored, persist_unleash_summary absence, and the CHECKPOINT: Call == 2 ceremony count), because the Context survey read only the demoNextSteps span boundary named in the #707/#737 history and missed the immediately following span and subtests. Symptom to watch for: a spec that names an existing variable (stepTenPersistence) while claiming the coverage does not exist.
