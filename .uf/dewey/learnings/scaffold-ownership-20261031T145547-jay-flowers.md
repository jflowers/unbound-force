---
tag: scaffold-ownership
author: jay-flowers
category: pattern
created_at: 2026-10-31T14:55:47Z
identity: scaffold-ownership-20261031T145547-jay-flowers
tier: draft
---

Resolving scaffold-vs-runtime ownership contradictions (unbound-force #884, opsx/reviewer-capabilities-init-survival): when a spec calls a manifest "closed" (Spec 005 FR-023: "the closed reviewer-capabilities manifest MUST be the only reviewer eligibility source"), "closed" describes the eligibility funnel — only manifest-listed agents dispatch — not immutability of the file by projects; FR-023's own clause "unknown agents MUST require an explicit valid review entry" anticipates project-added entries. The durable fix symmetrizes ownership across the whole registration surface (agent .md user-owned, uf/review-matrix.yaml project-owned, uf/reviewer-capabilities.yaml flipped tool-owned to project-owned with a comment mirroring the paired matrix branch), keeps the isToolOwned branch explicit rather than relying on the default fallthrough, flips the ownership test-table entry, and pins the contract with a re-run regression test asserting the Skipped disposition and byte-identical on-disk content. A disposition-level test (deployed bytes differ from embedded, plain re-run, assert Skipped) covers both the local-edit-survives and stale-canonical-does-not-auto-flow scenarios, because both exercise the same skip path. Drift-detection tests keep this repository's deployed .uf/ copy byte-identical to the embedded asset even after the reclassification, so canonical-list staleness in generated repos fails closed at dispatch with the precise remediation message rather than silently losing registrations.
