---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-19T20:39:06Z
identity: review-dispatch-20261019T203906-jay-flowers
tier: draft
---

Feedback items that cite a PR's own shipped Dewey learning are pre-verified acceptance candidates in /uf.address-feedback triage: the learning file is the author's or maintainer's own written acknowledgment of the gap, so the triage question reduces to the remedy vehicle, not the finding's validity. Learnings are draft-tier advisory artifacts — they cannot gate CI; only tests or a numbered follow-up issue riding the PR can enforce the fix. Observed triaging PR 761 comment 4318057541: the reviewer cited shipped learning review-dispatch-20261019T182357 (five untested execute paths in read_assessment_fields); every claim was verifiable against the frozen diff in minutes (grep the new test file for single-run_id calls, read the execute body's return paths, confirm the corrected command mandates the all-runs call), a sibling-tool grep confirmed the pattern claim (dispatch-status.test.ts:136 and fetch-pr-review-context.test.ts:1024 test their not_found branches), and the correct recommendation was ACCEPT with the remedy as either bounded tests in the PR's own new test file or a tracked, numbered issue referenced from the PR — never an unnamed deferral.
