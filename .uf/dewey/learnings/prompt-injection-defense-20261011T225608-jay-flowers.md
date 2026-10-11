---
tag: prompt-injection-defense
author: jay-flowers
category: pattern
created_at: 2026-10-11T22:56:08Z
identity: prompt-injection-defense-20261011T225608-jay-flowers
tier: draft
---

When adding a new untrusted input field to the review-dispatch prompt assembly pipeline (like `issue_content` for triage mode), the security checklist is: (1) add the field name to `UNTRUSTED_SECTION_NAMES` so `escapeDelimiters()` covers cross-section injection for the new delimiter pattern, (2) wrap the content via `wrapUntrusted()` which calls `escapeDelimiters()` then wraps in HTML comment delimiters, (3) apply the existing `MAX_STRING_BYTES` size check via the generic string-field iteration loop, (4) enforce mutual exclusivity with mode-incompatible fields via `superRefine` to prevent callers from mixing diff and issue content. The `issue_content` addition in the triage-prompt-support change correctly followed all four steps. The `UNTRUSTED_SECTION_NAMES` array now has 9 entries (was 8).
