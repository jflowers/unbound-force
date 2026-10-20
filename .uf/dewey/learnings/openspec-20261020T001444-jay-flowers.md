---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-20T00:14:44Z
identity: openspec-20261020T001444-jay-flowers
tier: draft
---

OpenSpec proposal.md "Modified Capabilities" entries must reference capabilities that actually exist — in mainline openspec/specs/ or in a pending prior change's specs/ delta. A delta using "## ADDED Requirements" under a new specs/<capability>/ directory creates a NEW capability and belongs under "New Capabilities". Before naming a capability, check the registry: the predecessor change may already have created a capability covering the same pipeline (dispatch-finalize-determinism created `dispatch-finalization` for review-dispatch consolidation/finalization semantics), and restating an existing requirement (e.g., a second "Scaffold Asset Parity" FR) under a parallel capability fragments governance and doubles the spec update surface.
