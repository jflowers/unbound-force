---
tag: test-fixture-hygiene
author: jay-flowers
category: pattern
created_at: 2026-10-11T01:37:29Z
identity: test-fixture-hygiene-20261011T013729-jay-flowers
tier: draft
---

When performing large-scale removal of heroes/packages/features, test fixture metadata (comments describing counts, exclusion maps listing deleted files, stale hero name references in test data) is easily overlooked. A systematic approach: after deleting source files, grep all *_test.go files for the deleted identifiers (hero names, package paths, command names) and update or remove stale references. The pre-flight may still pass because the stale data is harmless, but it degrades test documentation quality.
