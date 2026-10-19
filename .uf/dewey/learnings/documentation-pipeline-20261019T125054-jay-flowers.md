---
tag: documentation-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-19T12:50:54Z
identity: documentation-pipeline-20261019T125054-jay-flowers
tier: draft
---

A spec's issue-filing tasks must be validated against the live issue trackers of every target repository during spec review — the task's existence is not enough. Observed in spec review of fix-triage-issue-dispatch-docs: task 4.3 tasked filing a new unbound-force/website cross-repo docs issue with no duplicate-search step, while website#303 ("docs: one-call consolidate_dispatch finalization and kind-native run verdicts in review commands", open since 2026-10-13, filed for the antecedent dispatch-finalize-determinism change) already tracked website command-reference updates for the same commands and behaviors. The spec cross-referenced unbound-force#751 but not #303. Second angle in the same task: after a proposal expands scope mid-review (here, adopting the @opencode-ai/plugin 1.19.0 pin with its Node ^22.22.2 engine floor), the documentation-gate task's scope phrase must be re-derived from the full post-expansion user-facing surface — task 4.3 still said "command-doc changes" only, omitting the engine-floor prerequisite that uf init consumers inherit. Reviewer recipe: for every tasks.md item that files an issue, (1) run the duplicate search the task should mandate (gh issue list --label docs --state open on each target repo, plus keyword search on the change's subject terms), (2) require the task to mandate that search and cross-reference overlapping trackers by number, and (3) verify the task's scope phrase enumerates every user-facing surface the expanded change carries.
