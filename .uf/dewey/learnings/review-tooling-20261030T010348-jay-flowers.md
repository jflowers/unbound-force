---
tag: review-tooling
author: jay-flowers
category: gotcha
created_at: 2026-10-30T01:03:48Z
identity: review-tooling-20261030T010348-jay-flowers
tier: draft
---

When a mid-change review (spec review or council iteration) produces a fix that changes how a disposition is worded or scoped, retrofit the fix into every artifact carrying the defect signature — not only the downstream carrier the reviewer pointed at. In the extend-fetch-pr-review-context change, a spec-review fix differentiated the blog-decline wording in task 5.1's issue text, but proposal.md's Content pipeline bullet and tasks.md 5.3's fixed file-list scope kept the original undifferentiated patterns; the follow-up review re-found the same defect class in the unretrofitted artifacts. After applying a review fix, grep the change's artifacts for the defect signature (the exact phrase or pattern) and fix every hit in the same pass.
