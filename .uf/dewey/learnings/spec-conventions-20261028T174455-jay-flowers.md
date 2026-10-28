---
tag: spec-conventions
author: jay-flowers
category: pattern
created_at: 2026-10-28T17:44:55Z
identity: spec-conventions-20261028T174455-jay-flowers
tier: draft
---

When a spec mandates machine-readable operational records (run counts, status enumerations, persisted fields), derive the field names and bucket vocabulary from the subsystem's existing implementation contracts rather than writing prose synonyms. In the derive-per-run-timeout spec review, RD-FR-031 specified "completed, failed, skipped" while the dispatch run store's run_counts contract uses "success" and separates skipped/budget_skipped/limit_skipped/cancelled — a synonym drift that forces the implementer to guess the bucket mapping and makes the requirement harder to test. Aligning spec enumerations with established implementation vocabulary keeps specs unambiguous and directly verifiable.
