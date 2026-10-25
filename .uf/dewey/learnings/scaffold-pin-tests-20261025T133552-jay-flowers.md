---
tag: scaffold-pin-tests
author: jay-flowers
category: gotcha
created_at: 2026-10-25T13:35:52Z
identity: scaffold-pin-tests-20261025T133552-jay-flowers
tier: draft
---

When adding prose to a scaffolded command template that names a tool parameter (e.g., uf.unleash.md Step 5's fix-loop instruction "prompt-only (omit `command_path` and `checkpoint_step`; ...)"), audit the pin suite for negative assertions watching that token before the prose lands: the new mention sits inside every between() span that encloses it, and a span-global colon-form negative ("command_path:" absent over the whole Step 5 span, scaffold_test.go:486) then passes only by punctuation accident — the assertion-side rules (learnings scaffold-pin-tests-20261025T131744, test-quality-20261025T131750) seen from the authoring side. Resolve the coupling pin-side, not prose-side: land the call-site-scoped delegation-shape subtest for the new call site in the same diff (precedent scaffold_test.go:430-444, "code-review fix loop delegates through uf_delegate_command") so each negative assertion is attributed to its own call-site span and the step-span negative no longer polices prose it was never meant to guard.
