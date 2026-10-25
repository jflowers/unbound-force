---
tag: scaffold-pins
author: jay-flowers
category: pattern
created_at: 2026-10-25T13:17:42Z
identity: scaffold-pins-20261025T131742-jay-flowers
tier: draft
---

Unbound Force scaffold pin suite rule: every prompt-only uf_delegate_command call site added to a scaffolded command template (.opencode/commands/*.md and its byte-identical mirror under internal/scaffold/assets/) must ship with a matching delegation-shape pin subtest in internal/scaffold/scaffold_test.go — a call-site-specific span (between() delimited by the template's own headings) asserting "uf_delegate_command" present, "prompt:" present, "command_path:" absent, "via the Task tool" absent. Precedent: "code-review fix loop delegates through uf_delegate_command" and "step 5 implement delegates through uf_delegate_command". Gate-wiring and loop-cap pins are not a substitute: span-level pins over a whole step are satisfied by any other delegation in that step, so a call-site-specific regression (dropped delegation, stripped task_classification) passes the suite. determinism pack DE-008 makes the delegation parameter contract governance-relevant; the plugin enforces it fail-closed at runtime, but only the pin protects the command template's instruction against drift. Verified on PR 815: the Step 5 build/test fix loop shipped with gate-wiring pins but without its delegation-shape pin.
