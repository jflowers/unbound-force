---
tag: uf-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-19T16:11:27Z
identity: uf-workflow-20261019T161127-jay-flowers
tier: draft
---

Fallback-form clarification-marker log-mention treadmill (opsx/clarification-marker-superset, 2026-10-19): when a fallback-form marker (completely bare or colon-empty) is resolved, resolve_clarification logs the extracted question verbatim — and for fallback forms the question IS the raw marker text, so the appended "- Q: [NEEDS CLARIFICATION] -> A: ..." Clarifications entry itself grammar-matches. Scan re-surfaces the log mention as a question (remaining stays 1), and each tool-mediated resolution of that mention appends a fresh mention: tool-mediated resolution cannot terminate. The terminating path is manual removal of the literal marker syntax from the log entry (or the human clarify exit). Colon and bare-with-text forms terminate normally because their logged questions are plain text. Documented post-council (architect/sre/testing findings) in the spec delta scenario "Fallback-form log mention does not self-terminate", uf.unleash.md Step 1 operator note, design D4, and CHANGELOG; pinned by the resume-suite probe test over a log-mention-only steady state. General lesson: when a tool logs user input verbatim into a file the tool itself re-scans with a permissive grammar, audit the round trip — the fallback-to-raw-text design that guarantees non-empty questions also guarantees the log re-matches.
