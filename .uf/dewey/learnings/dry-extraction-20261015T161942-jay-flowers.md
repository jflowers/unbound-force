---
tag: dry-extraction
author: jay-flowers
category: pattern
created_at: 2026-10-15T16:19:42Z
identity: dry-extraction-20261015T161942-jay-flowers
tier: draft
---

When extracting a shared helper to DRY two consumers, enumerate each consumer's full output contract before freezing the helper's return type. If the helper returns a value class the legacy consumer never emitted (e.g., a four-valued branchType where the consumer emitted three), the refactor tasks MUST specify the mapping that preserves the legacy consumer's output shape, and the existing test suite must be extended to assert the previously-unasserted values — otherwise "output shape MUST be unchanged" is enforced only by implementer vigilance. Seen in openspec/changes/unleash-deterministic-tools tasks 1.2/1.3: uf-finale.test.ts asserts branchType only for non-main branches, so a four-valued classifyBranch passthrough would silently change main-branch output from "other" to "main" while tests stay green. Reviewer check: for any "refactor consumer to use shared helper" task, diff the helper's return type against the consumer's emitted shape value-by-value, and grep the consumer's tests for each affected field to confirm the preservation MUST is actually test-enforced.
