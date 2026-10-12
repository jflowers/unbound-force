---
tag: workflow-tier-simplification
author: jay-flowers
category: gotcha
created_at: 2026-10-12T15:14:30Z
identity: workflow-tier-simplification-20261012T151430-jay-flowers
tier: draft
---

When a change simplifies dual-path workflow guidance (e.g., removing WORKFLOW_TIER branching), verify that the simplified path works for ALL users of the system, not just the primary tier. In this case, /speckit.clarify was hardcoded where dual-tier branching previously existed, but /speckit.clarify only works for Speckit (specs/NNN-*/) and not for OpenSpec (openspec/changes/*/). The remaining WORKFLOW_TIER references in the same file confirm the concept is still active.
