---
tag: review-council
author: jay-flowers
category: gotcha
created_at: 2026-10-16T19:11:54Z
identity: review-council-20261016T191154-jay-flowers
tier: draft
---

A retrospective learning that documents an unpinned test gap does not discharge the regression-protection requirement. Observed on the opsx/unleash-deterministic-tools review (PR #745): the change stored four learnings each prescribing a test fix for a gap in that same change — none of the tests landed, and none of the learnings cited a tracking issue. Rule: when a learning says 'add a test that…', the test must land in the same change, or the deferral must be recorded in a verified-open tracking issue cited from the learning. Reviewer check: for every learning prescribing a test, grep the diff for that test; if it is absent and no issue is cited, raise a finding.
