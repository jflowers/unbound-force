---
tag: workflow-tier-guidance
author: jay-flowers
category: gotcha
created_at: 2026-10-12T14:55:17Z
identity: workflow-tier-guidance-20261012T145517-jay-flowers
tier: draft
---

When simplifying dual-path workflow guidance (e.g., removing WORKFLOW_TIER branching from specific locations), verify that the simplification is applied consistently across ALL locations in the file, or that the remaining locations still function correctly with the simplified path. Partial simplification — removing branching from 2 of 10 locations while hardcoding one tier's guidance — creates a behavioral regression for users of the other tier.
