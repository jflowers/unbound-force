---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-27T01:14:23Z
identity: documentation-gate-20261027T011423-jay-flowers
tier: draft
---

Documentation-gate per-file disposition records must restore the predecessor's documented shape, not just the finding that triggered them: when a spec-review finding says a docs-gate record lacks per-file dispositions, the fix must reproduce the full documented disposition-table pattern (every assessed file as a row, including explicit "No change" entries, per the #739 gate-assessment-table pattern) rather than a minimal finding-specific answer. Observed during the unleash-interactive-clarify spec review iteration 1 (2026-10-26, branch opsx/unleash-interactive-clarify): the compliant fix restored the complete per-file disposition shape from the marker-superset precedent instead of answering only the cited gap.
