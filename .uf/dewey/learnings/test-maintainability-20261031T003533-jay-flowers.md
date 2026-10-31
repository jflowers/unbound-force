---
tag: test-maintainability
author: jay-flowers
category: pattern
created_at: 2026-10-31T00:35:33Z
identity: test-maintainability-20261031T003533-jay-flowers
tier: draft
---

When a test suite pins file:line references to prose command files inside test names or comments (golden-output-shape.test.ts's site labels), nothing validates those labels against the files they reference, and they drift silently: every edit to a labeled file shifts labels below it, and prior changes leave labels stale that no current edit touches. Verified instance (forward-aggregate-correlation-id review, unbound-force, 2026-10-30): the change's edits to uf.unleash.md start at line 680, yet the pre-refresh golden labels still pointed get_progress at uf.unleash.md:55 and uf_unleash_branch_gate at :81 (actual locations :87 and :114 — stale from earlier changes); the label-refresh task re-derived every label from current file contents, fixing pre-existing staleness as a side effect. Rule: when any edit touches a file referenced by golden labels, re-derive all of that file's labels from current contents rather than applying only the current edit's delta — and note that a green suite does not imply label accuracy, because the tests assert call shapes, not the line numbers in their own titles.
