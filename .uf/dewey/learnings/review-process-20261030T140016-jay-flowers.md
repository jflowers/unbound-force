---
tag: review-process
author: jay-flowers
category: gotcha
created_at: 2026-10-30T14:00:16Z
identity: review-process-20261030T140016-jay-flowers
tier: draft
---

Converting review-council advisories into Dewey learnings inside the same PR documents a defect but does not remediate it. Observed in PR #874 (extend-fetch-pr-review-context): a prior council's advisories — including a ~3-line TMPDIR restore fix and a helper extraction into a shared test harness created in that same PR — were each captured as .uf/dewey/learnings files while the defects shipped unfixed, and a follow-up review then had to re-raise them as MEDIUM findings. When the fix is smaller than the learning that records it, apply the fix and keep the learning for the transferable insight only. Reviewers should treat "documented in a learning" as known-but-unresolved, not resolved.
