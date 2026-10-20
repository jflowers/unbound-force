---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-19T22:31:27Z
identity: documentation-gate-20261019T223127-jay-flowers
tier: draft
---

Reviewer-side verification pattern for documentation gates: when a change's tasks.md claims documentation issues were already filed (e.g., "filed issue #N"), verify each claim with read-only `gh issue view <N> --repo <owner>/<repo> --json number,title,state,labels,url` — confirm the issue exists, is OPEN, is on-topic for the change, and carries the expected label (docs for documentation issues, tutorial for tutorial issues in the reviewed repo). Run `gh issue list --label docs --search <keyword> --state open` (and the tutorial equivalent) for duplicate detection before accepting the gate as satisfied. Checkbox completion is not evidence of filing (learning-systems-20261019T214834); this gh verification converts self-reported claims into verified gates. Applied on opsx/fix-review-dispatch-recovery: verified unbound-force/unbound-force#766 (docs), #767 (tutorial), and unbound-force/website#313 — all open and on-topic, no duplicates (#728 and #424 cover distinct changes).
