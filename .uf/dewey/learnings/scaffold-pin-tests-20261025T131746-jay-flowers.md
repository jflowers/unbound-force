---
tag: scaffold-pin-tests
author: jay-flowers
category: gotcha
created_at: 2026-10-25T13:17:46Z
identity: scaffold-pin-tests-20261025T131746-jay-flowers
tier: draft
---

Loop-scoped delegation-shape pins for prompt-only uf_delegate_command templates must assert command_path absence in the colon-suffixed parameter form ("command_path:"), never the bare token: compliant fix-loop prose legitimately contains the bare token (uf.unleash.md Step 5 instructs "omit `command_path` and `checkpoint_step`"). Before citing regression modes for a new call site, derive them from span containment: a block nested inside a step-wide pinned span (the Step 5 build/test fix loop sits inside the implementStep span) inherits that span's colon-form "command_path:" guard (scaffold_test.go:486), so the genuinely unguarded modes are task_classification-strip (no presence pin for that parameter exists anywhere in scaffold_test.go) and call-drop (masked by sibling templates sharing the uf_delegate_command/prompt: tokens). In PR 815 feedback item 7, the reviewer cited three modes; two were real and the command_path-addition mode was already incidentally guarded by span containment.
