---
tag: opsxspawn-subtask-classification-params
author: jay-flowers
category: gotcha
created_at: 2026-10-26T02:38:20Z
identity: opsxspawn-subtask-classification-params-20261026T023820-jay-flowers
tier: draft
---

2026-10-26, branch opsx/spawn-subtask-classification-params: the uf_delegate_command harness timeout can fire AFTER a cobalt-crush-dev child session has already completed its work — in this change's Phase 3 (tasks 3.1 and 3.3) the delegation envelope returned DELEGATE_FAILED retryable while the child had in fact finished; the work landed in the working tree and tests ran green. Before re-delegating any timed-out uf_delegate_command call, always check git status/diff for the expected artifact and run the relevant tests; re-delegating completed work wastes a full child session and can duplicate edits.
