---
tag: content-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-27T01:14:28Z
identity: content-pipeline-20261027T011428-jay-flowers
tier: draft
---

When a spec's documentation task (tasks.md §6 / proposal Impact→Docs) records gate exemptions for a user-facing workflow change, verify it covers the full AGENTS.md documentation-gate file set (CHANGELOG.md, AGENTS.md, README.md) rather than only the files with obvious impact. In unbound-force/unbound-force, README.md documents /uf.unleash only at the tier-routing level (Specification Framework table), so pipeline-step interaction changes (e.g., the unleash-interactive-clarify ask gate) are README-exempt — but the exemption should be recorded in the task, matching the #739 gate-assessment-table pattern (per-page assessment rows including explicit "No change" entries). Verified during the unleash-interactive-clarify spec review (2026-10-26): in-repo docs target #739 and website counterparts #309/#310 all exist, are open, and are the correct search-first references; blog/tutorial thresholds are correctly not triggered (no new agent, CLI command, architectural migration, or hero capability — the ask gate modifies an existing command step's interaction).
