---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-22T12:16:50Z
identity: review-dispatch-20261022T121650-jay-flowers
tier: draft
---

capture_review_diff excludes untracked files outside the feature dir, so on the sequential path (no commits yet, base_sha == head_sha) uncommitted new source files are invisible to review-council. Untracked-ness reflects commit timing, not change membership. Stage new source files with explicit `git add` before the review steps, or the change's central modules will be absent from their own review diff — demonstrated by unleash-pipeline-hardening, whose review diff omitted `.opencode/lib/review-diff.ts` and its scaffold mirror entirely while the change's imports and Go asset-inventory tests depended on them.
