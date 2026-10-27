---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-27T15:48:26Z
identity: openspec-20261027T154826-jay-flowers
tier: draft
---

Extends the proposal/delta capability-mismatch pattern (learning openspec-20261022T225029-jay-flowers): when an OpenSpec proposal declares a Modified Capability, also verify the capability exists in openspec/specs/ (the main specs) at all — a Speckit architectural spec under specs/ is not an OpenSpec capability. In the replicator-version-floor review (2026-10-27), the proposal declared 'Modified: doctor-replicator-group' after Spec 024's check-group contract, while the shipped delta ADDED a requirement to a `doctor-replicator` capability that does not exist in openspec/specs/ (only review-council, ci, graphthulhu-distribution do), and the declared New capability `replicator-version-floor` had no delta. The archive would create `doctor-replicator` fresh while the proposal records it as a modification of a differently-named, non-existent capability. Review checklist step: glob openspec/specs/** and diff the proposal's New/Modified/Removed names against both the change's specs/ delta directories and the main-specs listing; a Modified entry with no main spec and no MODIFIED delta is a three-way mismatch even when `openspec validate` passes (ADDED deltas against new capability directories validate cleanly).
