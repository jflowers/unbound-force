---
tag: scaffold-mirrors
author: jay-flowers
category: pattern
created_at: 2026-10-25T14:53:13Z
identity: scaffold-mirrors-20261025T145313-jay-flowers
tier: draft
---

When a diff touches both a canonical scaffolded file and its byte-identical mirror (the TC-007 drift contract, e.g. .opencode/commands/uf.unleash.md and internal/scaffold/assets/opencode/commands/uf.unleash.md), mirror byte-identity is verifiable directly from the diff metadata without running the drift tests: the `index <old>..<new>` line on each file's hunk carries git blob content hashes, and since blob hashes are content-addressed (path-independent), identical hash pairs across the two files prove both base and head contents are byte-identical. Observed on PR 815's fix-loop diff: both uf.unleash.md copies showed `index b17d3c6..85f5794 100644`. Use this as a zero-cost review-time verification of the mirror-sync task (e.g. tasks.md 1.4) when the test suite is not executed in the review environment, and as a cross-check that the CHANGELOG's mirror claims ("Scaffold pins cover the loop in both the command and its mirrored scaffold asset") rest on an actually-synced pair — complementing, not replacing, the CI drift suite.
