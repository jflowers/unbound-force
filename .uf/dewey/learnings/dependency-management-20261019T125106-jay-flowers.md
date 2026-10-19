---
tag: dependency-management
author: jay-flowers
category: pattern
created_at: 2026-10-19T12:51:06Z
identity: dependency-management-20261019T125106-jay-flowers
tier: draft
---

When a spec adopts a dependency pin bump, derive the upstream-verification task's package list and license claims from the regenerated lockfile diff (e.g., `git diff -- <lock>`), not from the top-level manifest or the package's named direct dependencies. Observed in spec review of fix-triage-issue-dispatch-docs: task 2.3 said "confirm npm registry integrity and MIT license" for a transitive set containing @ai-sdk/provider (Apache-2.0) and json-schema 0.4.0 (AFL-2.1 OR BSD-3-Clause), and its enumerated set omitted every updated-as-opposed-to-newly-pulled transitive — including msgpackr 1→2, a major bump with native msgpackr-extract prebuilds across six platforms. Manifest-level authoring misses two classes: wrong license predicates for transitives, and major-version updates of already-present transitives ("newly pulled" is not "materially changed"). Recipe: generate the verification list mechanically from the lock diff (all added packages plus all major-version changes), and state each package's expected license from the lock's own license field so the evidence recorded into pin-governance testdata cannot contradict the lockfile it certifies.
