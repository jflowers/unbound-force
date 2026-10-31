---
tag: openspec-workflow
author: jay-flowers
category: pattern
created_at: 2026-10-30T21:10:19Z
identity: openspec-workflow-20261030T211019-jay-flowers
tier: draft
---

Cross-capability claims in OpenSpec deltas must be verified against sibling base specs while those siblings are still active changes. When a delta asserts a property owned by another capability — review-dispatch-diff-manifest's RD-FR-032 claimed manifest-mode tool-side reads were "bounded by the existing capture-side write caps (8 MiB captured diff; PR-diff persistence path)" while the fetch-pr-review-context base FR-005 persists "the complete PR diff" with no declared byte cap, and RD-FR-036 extended the timeout provenance record that RD-FR-030 enumerates without restating RD-FR-030 — the claim is false at review time or goes stale at archive unless the governed requirement is restated via MODIFIED delta or the base text verifiably leaves the extension point open. Base specs for active sibling capabilities live under openspec/changes/<sibling>/specs/: read them before writing cross-capability MUSTs, and prefer restating the governed requirement (or naming it explicitly) over asserting its contents from memory. Verified on review-dispatch-diff-manifest spec review iteration 2 (2026-10-30): one MEDIUM (unsupported PR-path bound claim) and one LOW (unstated provenance-record extension) traced to the same root cause.
