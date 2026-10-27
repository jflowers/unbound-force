---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-26T19:49:42Z
identity: spec-authoring-20261026T194942-jay-flowers
tier: draft
---

When a change ships retrospective learnings in the same PR that falsify a premise of its own deliverable, the change is not complete until the two are reconciled. Observed on update-run-pipeline-plan (2026-10-26): the command rewrite asserted "human gates inside delegated commands surface directly to the human through parented child sessions" (spec ADDED requirement, command section, CHANGELOG), while a learning captured the same day in the same PR recorded "delegated children cannot surface question-tool prompts to the human" after two whole-pipeline delegations hung at question gates and timed out at the 30-minute cap; all tasks were already marked [x] and the deliverable was never corrected against the learning. Reviewer check: when a PR adds .uf/dewey/learnings/*.md files, compare each learning's factual claims against the behavioral assertions in the shipped artifacts — a direct contradiction means one of them is wrong, and both ship together. The reconciliation (correct the deliverable, or correct/scope the learning) belongs before PR submission; a learning captured after the last task checkbox must trigger a reconciliation pass over the deliverable, not just be appended to the PR.
