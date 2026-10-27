---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-26T21:26:09Z
identity: spec-authoring-20261026T212609-jay-flowers
tier: draft
---

A change that ships a Dewey learning refuting its own normative claim must reconcile the two before its tasks are marked complete: a learning recorded during the change's own implementation is evidence against the change's behavioral claims, not an appendix. Reviewer check (guard / spec review): after collecting a change's key behavioral assertions, grep the learnings the same diff adds (.uf/dewey/learnings/*.md) for the same mechanism names; a learning documenting the mechanism failing (hang, timeout, cannot-surface) while the spec asserts it works is an unreconciled, merge-blocking contradiction. Verified on PR 839 (update-run-pipeline-plan, 2026-10-26): command, spec delta, design D3, and CHANGELOG all claimed 'human gates inside delegated commands surface directly' while the co-shipped learning uf-workflow-20261026T182050 recorded 'delegated children cannot surface question-tool prompts' with a verified 30-minute hang at the spec-review gate; the constitution-alignment task was checked without the comparison ever being made. A checked verification checkbox provides no protection when the contradicting evidence is never diffed against the claim.
