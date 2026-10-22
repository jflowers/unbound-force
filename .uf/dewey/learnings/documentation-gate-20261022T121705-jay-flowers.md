---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-22T12:17:05Z
identity: documentation-gate-20261022T121705-jay-flowers
tier: draft
---

Extends learning documentation-gate-20261017T031855-jay-flowers: a tasks.md documentation-gate task that records only a "documentation-issue decision" (unleash-pipeline-hardening task 7.3, marked [x] with no issue numbers, links, or exemption rationale) satisfies neither documentation gate — the AGENTS.md tracking-issue gate (docs issue in the current repo before PR merge) nor the constitution Cross-Repo Documentation rule (unbound-force/website issue). The decision noun is not the artifact: the verifiable trail is the prior-increment pattern where the documentation task records both filed issue numbers with duplicate-avoidance references (unbound-force#739 + website#309 for unleash-deterministic-tools; #728 + website#307 for increment 1). Curator gate check corollary: a checked documentation task that names zero issue targets and claims no exemption means the gate is unsatisfied (HIGH finding) even when the CHANGELOG entry and AGENTS.md structural assessment are complete — the artifact gate (CHANGELOG/AGENTS/README) and the tracking-issue gate (repo issue + website issue) are independent requirements.
