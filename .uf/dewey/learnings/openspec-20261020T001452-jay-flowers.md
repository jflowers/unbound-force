---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-20T00:14:52Z
identity: openspec-20261020T001452-jay-flowers
tier: draft
---

Before creating a new OpenSpec capability directory in a change, check openspec/specs/ (the archive-synced registry), any openspec/changes/archive/, and every active change's specs/ deltas for an existing capability whose description already covers the subsystem. In unbound-force, the in-flight dispatch-finalization capability explicitly covers "consolidation and finalization of Divisor review dispatches, including kind-native run verdicts"; a parallel review-dispatch-consolidation capability created for the top-level verdict layer fragments the subsystem's requirements across two spec files and duplicates its Scaffold Asset Parity requirement. Reconcile the proposal's New-vs-Modified capability labels against actual registry state (empty registry means every capability name is new; house convention lists fresh capabilities under New Capabilities with a description). Capability placement is nearly immutable after archive — fixing it at spec-review time is a directory rename; fixing it after archive is a migration.
