---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-22T22:49:55Z
identity: documentation-gate-20261022T224955-jay-flowers
tier: draft
---

A checked documentation-gate task that prescribes filing but records no issue number leaves the gate unauditable at review time — even if the issue was actually filed. Extends learning documentation-gate-20261022T121705-jay-flowers (zero-target variant) to the named-action variant: unbound-force change spec-review-per-finding-gate task 3.3 (marked [x], 'File the documentation issue for this user-facing spec review behavior change before PR merge') records no issue number, no target repo, and no website-gate scoping, while prior increments of the same gate recorded dual filings with duplicate-avoidance references (unbound-force#728 + website#307; unbound-force#739 + website#309). The verifiable trail is the issue number (or exemption rationale) recorded in the task or CHANGELOG at completion time — a Curator in a read-only dispatch cannot run gh, so the change record is the only reviewable evidence. Corollary: the constitution website gate must be scoped as its own task or assessment even when the AGENTS.md repo gate is satisfied; the two are independent requirements, and duplicate-avoidance must attach to the repo-local target where predecessor docs issues are most likely to exist. (Branch opsx/spec-review-per-finding-gate, 2026-10-22.)
