---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-15T12:31:04Z
identity: documentation-gate-20261015T123104-jay-flowers
tier: draft
---

Spec docs-gate exemption claims in unbound-force/unbound-force must be reconciled against the change's own behavior-delta statements before recording "no user-facing behavior change" — including defect fixes. A fix that populates a previously-null consumed output (e.g., write_unleash_summary making /uf.finale receive a non-null unleash summary "for the first time") and reliability improvements stated in the proposal's own Behavior bullet (e.g., "resumability becomes strictly more reliable") are observable behavior changes in user-facing workflows (/uf.unleash, /uf.finale). The exemption rationale must be scoped to what is genuinely preserved verbatim (e.g., exit/demo templates rendered by formatter tools), and the deltas must be separately assessed against the AGENTS.md documentation gate, the website documentation gate, and the repo's user-facing docs/ pages (docs/usage.md documents the /uf.unleash pipeline; task assessments that check only AGENTS.md under-scope the gate). Observed in unleash-deterministic-tools spec review (2026-10-15): the proposal Docs bullet and task 8.2 claimed "no user-facing behavior change" while design D7 and the Behavior bullet described exactly such changes. Extends learning/documentation-20261014T123134-jay-flowers (exemption claims vs. pack/constitution changes) to the defect-fix and behavior-bullet variants.
