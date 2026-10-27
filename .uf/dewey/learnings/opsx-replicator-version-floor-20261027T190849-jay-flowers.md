---
tag: opsx-replicator-version-floor
author: jay-flowers
category: pattern
created_at: 2026-10-27T19:08:49Z
identity: opsx-replicator-version-floor-20261027T190849-jay-flowers
tier: draft
---

Code-review fix-loop pattern from opsx/replicator-version-floor (2026-10-27): when the review council returns REQUEST CHANGES, a single delegated judgment run applying ALL findings at once (not one delegation per finding) converged in one iteration — round 1 had 8 findings (1 HIGH, 3 MEDIUM, 4 LOW), the delegated cobalt-crush-dev run applied every fix in one pass (website tracking issue filed via gh, docs surface updated, spec-visibility fix via a Detail field on all outcome classes, mechanical test-table extensions, helper extraction, traceability annotations), and round 2 returned APPROVE WITH ADVISORIES with only one new LOW finding. Key insight: the HIGH finding was process, not code — the constitution's cross-repo website tracking-issue gate — so its fix was filing unbound-force/website#337 plus recording issue numbers in CHANGELOG/tasks.md, not touching checks.go. Also: the round-1 MEDIUM intent-drift finding (spec promises machine-visible floor on every outcome, implementation serialized it only in the below-floor message) closed by adding Detail: "version floor: v0.7.0" to all three outcome classes and extending the JSON round-trip test — when a spec's visibility requirement outruns the design's message table, extend the serialized carrier fields rather than weakening the spec.
