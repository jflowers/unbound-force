---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-30T21:10:12Z
identity: review-dispatch-20261030T211012-jay-flowers
tier: draft
---

When a spec claims a tool-side read is "bounded by existing caps", verify which code path enforces each cap before accepting the claim: in the review-dispatch plugin the 8 MiB diff cap is a captureReviewDiff write cap on the local-capture path only (.opencode/lib/review-diff.ts), while fetch_pr_review_context persists the complete PR diff with no size cap (base FR-005). Requirements spanning both delivery paths must state the PR-path bound explicitly instead of citing capture-side caps.
