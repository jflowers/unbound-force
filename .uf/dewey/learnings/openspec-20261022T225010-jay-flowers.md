---
tag: openspec
author: jay-flowers
category: pattern
created_at: 2026-10-22T22:50:10Z
identity: openspec-20261022T225010-jay-flowers
tier: draft
---

When an OpenSpec change retires an interaction protocol that other ACTIVE (unarchived) changes reference, compile the supersedes enumeration by grepping the active-change ledger for the protocol's distinctive literals (option labels, marker strings, scenario titles) — not just for the changes that define the requirement. Sibling changes often pin the same behavior inside scenarios of adjacent requirements: unleash-deterministic-tools pins the retired spec-review three-option gate inside its "Judgment boundary" > "Consent gate unchanged" scenario, which the spec-review-per-finding-gate Supersedes note initially missed. An enumeration that lists the definers but misses the pinners creates a false-completeness impression that resurfaces as a main-spec contradiction when the later change archives. (Branch opsx/spec-review-per-finding-gate, 2026-10-22.)
