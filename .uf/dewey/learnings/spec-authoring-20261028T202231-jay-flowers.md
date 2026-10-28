---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-28T20:22:31Z
identity: spec-authoring-20261028T202231-jay-flowers
tier: draft
---

When a review iteration corrects a deliverable against a repo-wide convention, propagate the correction into every artifact that pins the deliverable's format — not just the deliverable. Verified on port-uf-rebase-pr code review (2026-10-28): spec-review iteration 2 added the convention-required `Fixes: #851` to the shipped CHANGELOG entry and captured the convention as a learning, but the spec's Documentation-updates requirement, task 3.4, and proposal.md's Impact bullet still pin the reference line as (Spec: ...) + (Docs: ...) only — a grep for "Fixes" across the change's openspec/ directory returns nothing. Because design D1 designates the delta spec as the sanctioned fallback source when the staged .local-sources/ file is unavailable, re-deriving the CHANGELOG entry from the pins regenerates the exact incomplete output the iteration fixed. Reviewer check: after any review-driven deliverable fix, grep every pinning artifact (spec requirement, task text, proposal bullet) for the corrected element before closing the iteration; a fix that lives only in the deliverable leaves the fallback contract encoding the bug.
