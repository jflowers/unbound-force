---
tag: test-quality
author: jay-flowers
category: pattern
created_at: 2026-10-25T13:35:55Z
identity: test-quality-20261025T133555-jay-flowers
tier: draft
---

When a command template gains a new subsection inside an existing pin's between() span and that subsection legitimately mentions a pinned token (e.g., a prompt-only delegation's omit-instruction naming `command_path`), a whole-step negative substring pin becomes punctuation-dependent: it passes only while the mention lacks the pin's suffix (the colon in "command_path:"), and any later rewording trips it with an error misattributed to the wrong delegation. Remedy: scope each negative assertion to the subsection it guards via a dedicated between() span — the pattern scaffold_test.go:430-444 already uses for the Step 6 code-review fix loop (between "enter the fix loop" and the INCONCLUSIVE-or-UNAVAILABLE bullet; its own template legitimately carries a bare `command_path` mention at uf.unleash.md base line 1315 inside that correctly-attributed span) — keeping one negative per delegation region so failure attribution stays correct. Observed on PR 815: the build/test fix-loop block (head uf.unleash.md:879-943) inserted "omit `command_path` and `checkpoint_step`" into the implementStep span guarded by the whole-span negative at scaffold_test.go:486.
