---
tag: code-review
author: jay-flowers
category: gotcha
created_at: 2026-10-26T19:49:36Z
identity: code-review-20261026T194936-jay-flowers
tier: draft
---

A feature PR that commits retrospective Dewey learnings captured during its own spec/code-review cycles ships the freshest empirical evidence about the change alongside the artifacts — reviewers must cross-check every same-PR learning against the shipped text before approving. Verified on update-run-pipeline-plan (PR #839, 2026-10-26): the shipped command asserted "human gates inside delegated commands surface directly to the human" and that a paused-exit re-run "resumes from its durable state", while same-PR learnings recorded that delegated children cannot surface question-tool prompts (a whole-pipeline delegation hung at the spec-review gate and the parent had to relay it) and that the tier-routing pre-branch variants have no durable state and need the work-item description re-supplied on re-run. The learnings (stored 18:20) postdated the artifact text; nothing reconciled them, so the PR carried a protocol and its refutation together. Reviewer recipe: for each learning file added in a diff, grep the change's shipped artifacts for the mechanism the learning describes; a contradicting hit means the artifacts were not updated after the learning was captured — flag the contradiction for resolution (verify one side or fix the other) rather than treating either as stale by assumption.
