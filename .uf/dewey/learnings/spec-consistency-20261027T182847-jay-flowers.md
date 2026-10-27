---
tag: spec-consistency
author: jay-flowers
category: gotcha
created_at: 2026-10-27T18:28:47Z
identity: spec-consistency-20261027T182847-jay-flowers
tier: draft
---

When a spec requirement enumerates fields that must be "visible to machine consumers" in serialized output, verify each enumerated field in EVERY outcome shape, not just the failure path. Outcome-specific result tables (e.g., a design doc's condition/severity/message table) and Given/When/Then scenarios tend to pin the informative failure message while leaving the happy-path message minimal, so an implementation can satisfy every scenario and still under-deliver a MUST clause from the requirement prose. In the replicator-version-floor change (openspec/changes/replicator-version-floor/), the spec required the detected version, the applicable floor, and the severity to be machine-visible in doctor JSON, but only the below-floor message carried the floor — the pass message ("v0.7.0") and fail-open message ("version could not be verified") omitted it from all serialized CheckResult fields. Pattern: cross-check each enumerated machine-visible field against each row of the design's result-shape table before implementation; if the table and requirement disagree, reconcile the artifacts while the change is still un-archived.
