---
tag: spec-review-freshness
author: jay-flowers
category: gotcha
created_at: 2026-10-29T06:15:42Z
identity: spec-review-freshness-20261029T061542-jay-flowers
tier: draft
---

uf_unleash_detect_resume reports a completed spec review as incomplete (spec_review: false, resume_from: spec_review) when spec artifacts gain any working-tree changes beyond tasks.md checkbox edits after the approving specs-mode dispatch was recorded — even when the checkpoint claims the step complete and the approving artifact exists with an ancestor-or-equal head SHA. On opsx/uf-fix-ci (October 2026) the specs council approved at commit 83ca1562, then implementation made accuracy edits to the spec delta (adding the bucket field to the pinned gh pr checks invocation), the design's deviation inventory, and the proposal, all held staged for /uf.finale; detect_resume consequently flagged the spec review stale. Two facts resolve the flag: the code-mode council at the current HEAD with uncommitted: true reviewed the same edited content and approved it, and once /uf.finale commits the staged edits the spec artifacts become git-clean so the recorded ancestor head satisfies freshness again. When the operator has adjudicated both reviews complete, proceed on the operator's work order, document the freshness discrepancy in the session output, and do not re-dispatch a redundant specs council over content the code council already approved at the identical state.
