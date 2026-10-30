---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-16T19:11:52Z
identity: openspec-20261016T191152-jay-flowers
tier: draft
---

When a branch merge deduplicates a mechanism that a merged-but-unarchived sibling OpenSpec change has specced, record the spec-level reconciliation explicitly — a MODIFIED/REMOVED delta against the sibling's capability, or a sequencing note plus a deferred-validation task (the unleash-deterministic-tools task 9.2 pattern for Increment 1). A code-level compatibility alias preserves the tool registration surface but not the sibling's requirement text: parameter contracts (e.g. 3-param persist_unleash_summary specced vs 8-param write_unleash_summary delivered via the alias), call-site instructions in command prose (FR-006 named persist_unleash_summary; the command now instructs write_unleash_summary), and error-code semantics can silently diverge. Cross-capability contradictions are invisible to openspec strict validation, so whichever change archives second lands main-spec requirement text that contradicts actual behavior. Example: PR #745 (unleash-deterministic-tools) vs the persist-unleash-summary change on origin/main.
