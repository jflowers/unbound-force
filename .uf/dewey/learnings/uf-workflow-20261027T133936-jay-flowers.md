---
tag: uf-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-27T13:39:36Z
identity: uf-workflow-20261027T133936-jay-flowers
tier: draft
---

A command that prescribes uf_delegate_command delegations must state the timeout parameter alongside every parameter it names or omits: the tool's default (600,000 ms) is far below whole-pipeline runtimes, and silence ships the default invisibly. Verified on update-run-pipeline-plan (PR 839 council review, 2026-10-27): the rewritten /uf.run-pipeline-plan delegation contract enumerated the parameters to omit (task_classification, checkpoint_step, expected_artifact) but never mentioned timeout, while the same PR's learning uf-workflow-20261026T182050 recorded two whole-pipeline /uf.unleash delegations timing out — one at a question gate, one mid-implement — even at the 30-minute maximum. Reviewer check: for every prescribed delegation in a command under review, compare the delegated workload's expected duration against the delegation tool's timeout contract (default and maximum); an unstated timeout on a long-running delegation is an undocumented trade-off requiring an explicit parameter, a design-risk acknowledgment naming the overrun failure mode and its recovery path, or both. Same-PR learnings recording delegation timeouts are the nearest evidence for expected duration.
