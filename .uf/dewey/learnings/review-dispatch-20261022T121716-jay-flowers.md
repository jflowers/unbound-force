---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-22T12:17:16Z
identity: review-dispatch-20261022T121716-jay-flowers
tier: draft
---

capture_review_diff (review-dispatch plugin) scopes untracked and git-ignored file capture to the feature dir. In the uncommitted posture — a branch with no commits, head == base — every NEW file a change creates outside openspec/changes/<name>/ is untracked and therefore silently absent from the review diff; the excluded array reports nothing because ls-files never enumerates files outside the pathspec. The unleash-pipeline-hardening change demonstrated this: its core lib (.opencode/lib/review-diff.ts), dedicated test suite (.opencode/test/review-diff.test.ts), and scaffold mirror were all invisible to the review council reviewing the change that introduced them. Mitigations: stage files (git add) before review capture so they surface as tracked changes, surface untracked non-ignored files outside the feature dir in the excluded array with an explicit reason, or add a regression scenario for the attributable-file-outside-feature-dir case.
