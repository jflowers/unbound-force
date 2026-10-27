---
tag: workflow-governance
author: jay-flowers
category: pattern
created_at: 2026-10-24T16:06:48Z
identity: workflow-governance-20261024T160648-jay-flowers
tier: draft
---

Repo precedent check for /uf.unleash behavior changes in unbound-force/unbound-force: every prior pipeline-behavior modification landed through an OpenSpec change (openspec/changes/unleash-tier-routing, unleash-direct-review-dispatch, unleash-compression-resilience, unleash-deterministic-tools, spec-review-per-finding-gate), and quick-tier routing only ever creates quick/<name> branches. A bare-named feature branch (no NNN-*, opsx/*, or quick/* prefix) carrying an unleash behavior change therefore proves no tier was entered — no route-decision rationale, no risk-floor check, PR body as the only intent record, and a CHANGELOG entry with no Spec: path. The Guard can verify this cheaply at review time: grep openspec/changes/ for the change name and check the branch prefix against the tier table. Content quality (faithful implementation, CHANGELOG entry, byte-identical scaffold mirror, pin test) does not cure the entry-path gap — it caps severity at HIGH instead of CRITICAL. Companion gap to check in the same pass: the AGENTS.md documentation-issue gate for user-facing workflow changes (precedent: missing website docs issue flagged HIGH by the council on 2026-10-23 for opsx/fix-review-dispatch-correlation-release).
