---
tag: test-quality
author: jay-flowers
category: pattern
created_at: 2026-10-24T16:06:50Z
identity: test-quality-20261024T160650-jay-flowers
tier: draft
---

Pin tests that guard command-prose contracts via strings.Contains on between()-extracted spans verify phrase presence, not per-site wiring. A generic feature-phrase Contains is satisfied by any single wiring site, and case or hyphenation variants (a capitalized "**Feature**" header, a hyphenated "feature-call" in a contract enumeration) silently dodge a lowercase pin. When pinning a feature wired into multiple gates or steps, enumerate one distinct phrase from each wiring site in the parameter table — the span machinery in internal/scaffold/scaffold_test.go states its purpose as proving "the tool is invoked by its consuming step, not merely mentioned elsewhere in the command". New prompt-only uf_delegate_command call sites need a dedicated delegation-shape subtest (precedent: "code-review fix loop delegates through uf_delegate_command", scaffold_test.go:430-444, pinning uf_delegate_command, "prompt:", "task_classification:", and the absence of "command_path:"), because step-span-level delegation pins are already satisfied by per-task delegations and cannot detect loop-specific regressions. Negative Contains pins ("command_path:" must not appear) also become punctuation-dependent once prose mentions the token to instruct its omission — scope such negatives to a dedicated loop span rather than the whole step.
