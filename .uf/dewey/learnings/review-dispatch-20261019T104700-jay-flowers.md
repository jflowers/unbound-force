---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-19T10:47:00Z
identity: review-dispatch-20261019T104700-jay-flowers
tier: draft
---

review-dispatch child runs that approach the model context ceiling (~365k input tokens observed on enmaas/rits/zai-org/glm-5-3) abort during final-response generation; a run that already submitted findings is still recorded as failed, and consolidate_dispatch then rejects the whole payload ("non-success run ... must not vote or emit findings") with no sanctioned recovery path (filed as unbound-force/unbound-force#751, recurring across at least six sessions Oct 14-19 2026). Live example from spec review of fix-triage-issue-dispatch-docs: divisor-guard completed its review, had 6 findings + 1 proposal ACCEPTED, began its final text, then aborted at ~363k tokens; divisor-architect aborted mid-review at ~369k with zero submissions. When a dispatch finalization fails with the non-success-run rejection, read the child sessions' token counts via db_read_session before assuming a child defect — context exhaustion and zero-output zombie launches (0 tokens, 1 part) are the observed triggers, not the per-run timeout.
