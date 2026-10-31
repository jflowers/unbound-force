---
tag: content-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-30T21:10:17Z
identity: content-pipeline-20261030T211017-jay-flowers
tier: draft
---

When a spec change declares MODIFIED requirements for a capability, the documentation-impact verification for dependent command prose MUST grep for assertions of each modified behavior, not just the most prominent one — otherwise the work gets misclassified as purely additive and affected files drop out of scope. Verified on review-dispatch-diff-manifest spec review iteration 2 (2026-10-30): the change modifies both FR-004 (diff section becomes delivery-mode-dependent) and FR-013 (2 MiB oversized-diff rejection becomes delivery-mode-dependent) in the build-review-prompts capability. Task 7.1's verification predicate checked only inlining assertions ("no current command prose asserts the complete diff is inlined in every prompt" — true), concluded "additive documentation, not realignment" (false), and omitted uf.address-feedback.md from its expected-targets list — yet uf.address-feedback.md §1.4 lines 191-193 assert the FR-013 behavior verbatim ("the dispatch path enforces its read-time size limit and surfaces oversized diffs as the structured `prompt_size_exceeded` error"), which the change falsifies for over-threshold diffs. Recipe: (a) enumerate every MODIFIED/ADDED requirement behavior declared in the change's delta specs; (b) for each behavior, grep the command/consumer surface for its vocabulary — error codes, warning substrings, limit names, tool names; (c) only then classify the documentation work as additive vs realignment and enumerate expected targets from the grep results, applying the task's own inclusion criterion consistently (commands that drive the dispatch, not just commands the author recalls). A criterion-based mechanical search beats recall for scoping documentation targets, and the criterion must match the grep actually run.
