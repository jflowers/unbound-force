---
tag: content-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-23T17:19:14Z
identity: content-pipeline-20261023T171914-jay-flowers
tier: draft
---

A shipped learning's snapshot of mutable issue-tracker state (labels, open/closed) can be stale by review time when the learning's own recommended remediation was applied after it was written — child reviewers must verify the CURRENT tracker state via read-only gh calls, not cite the learning's snapshot as finding evidence. Verified on rebase-upstream-before-push (unbound-force/unbound-force, 2026-10-23): the PR ships learning documentation-20261023T162203 recording that docs-gate issues #810 and unbound-force/website#320 were created with empty label sets; gh issue view at council-review time showed both issues now carry the docs label (the learning's recommended after-the-fact `gh issue edit --add-label docs` remediation had been applied), and the canonical duplicate-check query `gh issue list --label docs --search finale` now returns #810 first — collapsing what would have been a LOW label-hygiene finding filed on the learning's snapshot. Recipe: when a diff ships a learning describing mutable external state, treat it as historical testimony of the state at learning-creation time; re-verify the live state (one read-only gh issue view per recorded number, with repo qualifier) before filing any finding that depends on it, and cite the verification command's output — not the learning — as the finding's evidence.
