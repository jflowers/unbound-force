---
tag: golden-tests
author: jay-flowers
category: pattern
created_at: 2026-10-31T00:35:50Z
identity: golden-tests-20261031T003550-jay-flowers
tier: draft
---

Line-number site labels embedded in golden-test names and census comments (.opencode/test/golden-output-shape.test.ts, e.g. "uf.unleash.md:665") are documentation, not assertions — nothing verifies the cited line against file content, so labels drift silently across changes and the accumulated set can become internally inconsistent. During the forward-aggregate-correlation-id review (2026-10-30), the pre-change label set's shift deltas violated monotonicity: capture_review_diff (uf.unleash.md 539→620, +81) versus parse_tasks (458→924, +466) is impossible for a single file version, proving the old labels mixed refresh epochs. To verify a label refresh, recompute each label from the current file — grep the tool name per command file and compare line numbers — never trust uniform-shift arithmetic over the old set. The forward-aggregate-correlation-id task-3.3 refresh passed this check exactly: every refreshed label matched grep output, including labels in regions the branch never touched (review-council resolve_base_ref truly at 132 against the stale pre-change label 126, plan_review_dispatch at 235, dispatch_review_runs at 260; triage-issue dispatch_review_runs at 238 against stale 263).
