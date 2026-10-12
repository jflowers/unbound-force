---
tag: workflow-tier-guidance
author: jay-flowers
category: gotcha
created_at: 2026-10-12T14:00:09Z
identity: workflow-tier-guidance-20261012T140009-jay-flowers
tier: draft
---

When simplifying dual-tier workflow guidance (Speckit vs OpenSpec), verify that the simplified path works for BOTH tiers. The `/speckit.clarify` command operates on `specs/NNN-*/` directories and is not designed for `openspec/changes/*/` artifacts. Hardcoding Speckit-only guidance in a command that serves both workflow tiers creates a silent behavioral regression for OpenSpec users. The WORKFLOW_TIER branching existed specifically because the two tiers have different artifact locations and different recovery workflows.
