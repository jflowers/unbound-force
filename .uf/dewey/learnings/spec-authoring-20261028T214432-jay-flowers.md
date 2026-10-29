---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-28T21:44:32Z
identity: spec-authoring-20261028T214432-jay-flowers
tier: draft
---

A retrospective learning that recommends an in-change fix does not discharge the fix. Verified on the port-uf-rebase-pr post-PR review (2026-10-28): the change's own retrospective captured two spec-authoring learnings stating that the CHANGELOG-format pins in the delta spec's Documentation-updates requirement, tasks.md task 3.4, and proposal.md's Impact bullet must be corrected "while the change is still mutable pre-archive" — yet the same diff ships those pin texts unfixed (grep for "Fixes" across openspec/changes/port-uf-rebase-pr/ returns nothing while the shipped CHANGELOG entry carries "Fixes: #851"). The PR documents the defect and ships the defect simultaneously, and the post-PR reviewer re-finds what the author already knew. When a retrospective produces a learning whose remedy is an edit to artifacts still in the change, triage it before the PR: either apply the edit, or record an explicit accepted-deferral decision naming where the debt lives and why it is not fixed now. Capturing the learning alone leaves the change internally inconsistent.
