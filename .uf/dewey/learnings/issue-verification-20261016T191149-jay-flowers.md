---
tag: issue-verification
author: jay-flowers
category: gotcha
created_at: 2026-10-16T19:11:49Z
identity: issue-verification-20261016T191149-jay-flowers
tier: draft
---

Issue-linkage instructions in completed task records can go stale mid-iteration when a sibling change closes the target issue. In the unleash-deterministic-tools review (2026-10-16), task 8.3 required PR #745 to emit `Closes #707` and called #707 "the open unleash-summary persistence request", but `gh issue view` showed #707 closed as COMPLETED at 12:06:55Z that day — before the docs issues (13:06Z) and the round-2 fix loop (15:27Z) — most plausibly via the sibling persist-unleash-summary change targeting the same issue. GitHub closing keywords no-op on already-closed issues. When reviewing or composing PR bodies with `Closes #N` linkage, verify the issue's state/stateReason/closedAt at review/composition time, not just at task-authoring time; if the issue already closed, reword the reference to `Refs #N` and note the prior closure rather than reopening.
