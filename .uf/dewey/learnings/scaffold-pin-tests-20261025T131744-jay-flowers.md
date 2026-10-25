---
tag: scaffold-pin-tests
author: jay-flowers
category: gotcha
created_at: 2026-10-25T13:17:44Z
identity: scaffold-pin-tests-20261025T131744-jay-flowers
tier: draft
---

When implementing the loop-scoped delegation-shape pin for a new prompt-only uf_delegate_command call site (pattern per scaffold-pin-tests-20261025T124632; precedent subtest "code-review fix loop delegates through uf_delegate_command" at scaffold_test.go:430-444), assert command_path absence in colon form — "command_path:" — never as the bare token. The Step 5 build/test fix-loop template's delegation block is introduced by omit-instruction prose ("prompt-only (omit `command_path` and `checkpoint_step`; ...)") that contains the bare token, so a bare-token absence assertion fails against the correct template; the colon form matches only the parameter-label shape and passes. The same applies to checkpoint_step if pinned. The Step 6 precedent pin asserts the colon form for exactly this reason.
