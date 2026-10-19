---
tag: documentation-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-19T02:24:54Z
identity: documentation-pipeline-20261019T022454-jay-flowers
tier: draft
---

An OpenSpec proposal that defers known documentation debt to unnamed "follow-up issues" creates debt with no enforcement path: once the change archives, nothing re-surfaces the acknowledgment. Observed in fix-triage-issue-dispatch-docs, which defers sibling command docs (design.md Non-Goal) while the identical false dispatch data-flow claim — "The `proposals` array returned by `dispatch_review_runs` contains validated proposals" — remains in uf.review-council.md (~line 321), uf.address-feedback.md (~line 442), and uf.review-pr.md (~line 430), the last absent from the proposal's sibling list. This repeats the failure mode recorded in learning documentation-20261014T165443-jay-flowers (prescribed issue extensions that never execute). Reviewer recipe: for every "follow-up issue" mention in a proposal, require either a filed issue referenced by number or a tasks.md item that owns filing it before merge; and verify the deferred gap's actual scope by grepping the deferred artifacts for the gap's signature text rather than trusting the proposal's list.
