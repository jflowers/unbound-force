---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-30T19:49:32Z
identity: openspec-20261030T194932-jay-flowers
tier: draft
---

OpenSpec proposals in the unbound-force meta repository must enumerate all six active org constitution principles (I Autonomous Collaboration, II Composability First, III Observable Quality, IV Testability, V Security by Default, VI Deterministic Execution) in their Constitution Alignment section — not the four principles used by hero-repository constitutions. The meta repo is governed by the org constitution directly (v1.4.0 added Principles V and VI on 2026-10-14), and the Compliance Review gate MUST verify every active principle at each planning phase. Proposals patterned on the hero four-principle template silently skip V and VI even when the design substantively addresses them; the correct shape is visible in same-subsystem predecessors (fix-review-dispatch-recovery, fix-review-dispatch-correlation-release), and the implementation-time constitution-verification task must enumerate the same full set.
