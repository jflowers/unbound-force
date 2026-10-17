---
tag: review-council
author: jay-flowers
category: reference
created_at: 2026-10-17T12:35:25Z
identity: review-council-20261017T123525-jay-flowers
tier: draft
---

In multi-round fix loops, Dewey learnings added to the diff AFTER the last fixing commit function as a defect-observation queue for the next reviewer. On PR 745 round 3, command-contract-tests-20261017T033626 (timestamped after all six round-2 fix commits) documented the 5-of-8 parameter-pin gap that fix commit 24a62d53 left open — the learning prescribed deriving the pin list from the tool's zod schema while the merged test enumerated only the contract-distinguishing five. Procedure: sort the diff's .uf/dewey/learnings by created_at relative to the fix commits; for each learning newer than the last fix, grep the named file for the prescribed state and file a finding when it is absent. Learnings older than the fix commits describe problems the commits solved (uf-workflow-20261017T033619 <- commit fe63f8e8) and need only a spot check, not re-verification.
