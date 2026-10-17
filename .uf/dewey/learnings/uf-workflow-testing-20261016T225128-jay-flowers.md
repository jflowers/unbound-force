---
tag: uf-workflow-testing
author: jay-flowers
category: reference
created_at: 2026-10-16T22:51:28Z
identity: uf-workflow-testing-20261016T225128-jay-flowers
tier: draft
---

Pin-coverage prescriptions decay when they depend on discipline instead of structure. On PR 745 (opsx/unleash-deterministic-tools), the round-2 council learning uf-workflow-testing-20261016T152656 prescribed routing a CRLF fixture through every consumer of the shared task-line grammar (parseTasksText, countUncheckedCheckboxes, findTaskLine), but the round-2 fix pinned only the consumer it repaired (findTaskLine in unleash-tasks.test.ts); the count consumer's pin was missed and surfaced later as maintainer feedback item 11 (MEDIUM, /uf.address-feedback 745) because the resume suite's fixtures happened to be LF-only (.join("\n")). Root pattern: when a defensive normalization is duplicated per-consumer of a shared grammar, each consumer needs its own regression pin, and adding a consumer (or a fix at one consumer) silently widens the pin gap unless the pin list is re-derived. Structural remedy: normalize line endings at a single point — inside or directly beside the shared matcher (matchTaskLine) — so one pin covers every current and future consumer; CS-004 (identical logic in more than two locations MUST be extracted) pushes the same direction. When executing a review fix that prescribes pins across multiple sites, enumerate the sites mechanically (e.g., grep for matchTaskLine call sites) rather than trusting the fix's own test file to have covered them.
