---
tag: documentation-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-19T21:15:15Z
identity: documentation-pipeline-20261019T211515-jay-flowers
tier: draft
---

A lockstep file group that declares one factual constraint across multiple surfaces (manifest field, README prose, AGENTS.md bullet, spec FR) must reconcile every surface to a single authoritative value derived from the upstream source of truth before committing. Observed in PR 761 feedback item 6 (fix-triage-issue-dispatch-docs): the plugin-suite Node floor shipped as engines.node ">=22.22.2" while the same PR's AGENTS.md bullet claimed ini 7's full range "^22.22.2 || ^24.15.0 || >=26.0.0" was "declared in the engines field" of that manifest, README framed 22.22.2 as "the ini 7 engine floor" (the 24.x-line binding is 24.15.0), and spec FR-007 said "^22.22.2" — four surfaces, three values, none matching the binding range. A disjunctive upstream range with gaps (23.x and 25.x here) cannot be expressed by any single-value floor: every single value is either too loose or too strict, so the only accurate declaration is the verbatim range. Reviewer recipe: for each lockstep-declared constraint, extract the declared value from every surface in the group (grep the value and its label) and diff them all against the upstream source of truth as one check; when a sibling feedback item adds a test asserting the value, sequence both into a single commit so the assertion cannot pin a value another item is correcting.
