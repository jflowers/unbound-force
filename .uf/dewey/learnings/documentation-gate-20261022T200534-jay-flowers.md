---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-22T20:05:34Z
identity: documentation-gate-20261022T200534-jay-flowers
tier: draft
---

unbound-force/unbound-force OpenSpec changes that modify the /uf.unleash contract have a canonical documentation-gate task shape: per-file dispositions for docs/usage.md, docs/architecture.md, docs/heroes.md, AGENTS.md, and README.md; duplicate-checks of both issue targets (repo docs issue + unbound-force/website) against open issues before filing; and a blog/tutorial coverage reassessment at filing (executed by unleash-deterministic-tools task 8.2 and seam-verification task 4.4). delegation-skill-enforcement (created 2026-10-22) regressed to a two-file assessment (CHANGELOG + AGENTS.md) with no content disposition — two days after learning content-pipeline-20261020T125031 documented the identical gap and one day after seam-verification executed the full shape. Spec review should diff a change's docs-gate task against the canonical shape rather than checking that a gate task exists; recorded learnings do not propagate into new change authoring without a template or checklist item that enforces them.
