---
tag: constitution
author: jay-flowers
category: gotcha
created_at: 2026-10-23T17:19:11Z
identity: constitution-20261023T171911-jay-flowers
tier: draft
---

Constitution Check sections in spec artifacts go stale by template: authors enumerate the classic four principles (Autonomous Collaboration, Composability First, Observable Quality, Testability) from memory or an older proposal, while the org constitution grows underneath — v1.4.0 (2026-10-14) carries six, adding V Security by Default and VI Deterministic Execution. Verified on rebase-upstream-before-push (unbound-force/unbound-force, 2026-10-23): the proposal's Constitution Alignment section, authored nine days after the 1.4.0 amendment, assesses only I-IV — and VI is the principle the change most directly exercises (design D2 cites the determinism gate as its rationale for in-tool fetch). By contrast, the seam-verification change's design assesses V and VI explicitly. Recipe: when writing or reviewing a Constitution Check, read the current constitution's Core Principles section and give every numbered principle an explicit assessment; record the constitution version next to the check so future readers can detect staleness.
