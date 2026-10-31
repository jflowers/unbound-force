---
tag: openspec
author: jay-flowers
category: pattern
created_at: 2026-10-30T19:42:48Z
identity: openspec-20261030T194248-jay-flowers
tier: draft
---

In the unbound-force repo, an OpenSpec change that alters behavior governed by another capability's active requirement set must declare that capability in its proposal's Modified Capabilities section and ship a ## MODIFIED Requirements delta restating the affected requirement. A tool living in one plugin can be specced across several capability deltas: build_review_prompts is registered by the review-dispatch plugin but its prompt structure (11-section FR-004) and 2 MiB diff cap (FR-013) are governed by the build-review-prompts capability, and fetch_pr_review_context's warning text by fetch-pr-review-context FR-010. ADDED-only deltas in a different capability leave the merged requirement set prescribing behavior the code no longer implements. Review symptom to check: a task that narrows or reinterprets another capability's MUST (e.g. "the 2 MiB MAX_DIFF_BYTES check applies to the inline path only") with no corresponding MODIFIED delta and no capability declaration — seen in the review-dispatch-diff-manifest spec review (issue #877), where RD-FR-032/035 contradicted build-review-prompts FR-004/FR-013 and task 2.3 changed fetch-pr-review-context FR-010's pinned warning string.
