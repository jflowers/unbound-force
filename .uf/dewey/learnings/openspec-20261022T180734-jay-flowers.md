---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-22T18:07:34Z
identity: openspec-20261022T180734-jay-flowers
tier: draft
---

When a spec change's risk register asserts that a sibling artifact "was corrected" to reconcile a factual discrepancy, verify the sibling artifact actually carries the correction before trusting the reconciliation claim. In multi-artifact OpenSpec changes, a correction applied to a prose paragraph can miss a bullet-list restatement of the same number in the same file, leaving the design's "the corrected proposal cites the artifact trail" claim contradicted by the proposal it describes. Cross-artifact numerical claims (e.g., which verification round recorded a coverage baseline) should be grepped across every artifact of the change, not just the artifact that documents the reconciliation.
