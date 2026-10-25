---
tag: test-quality
author: jay-flowers
category: gotcha
created_at: 2026-10-25T13:17:50Z
identity: test-quality-20261025T131750-jay-flowers
tier: draft
---

Refinement to the delegation-shape pin pattern (learnings test-quality-20261024T160650, scaffold-pin-tests-20261025T124632): step-span pins in internal/scaffold/scaffold_test.go behave differently by assertion kind, and drift-mode audits must check each kind separately. Positive span pins (uf_delegate_command / "prompt:" present over the whole Step 5 span) are satisfied by ANY sibling call site — a dropped loop-specific delegation escapes undetected. Negative span pins ("command_path:" absent over the whole Step 5 span, scaffold_test.go:486-488) are span-GLOBAL: a template-notation command_path: addition to any call site in the step fails the suite, but the error message misattributes the failure to per-task delegation, and colon-less prose drift (e.g. "pass command_path when a repo command applies") escapes because the pin is punctuation-dependent. Only a loop-scoped span (precedent scaffold_test.go:430-444) attributes failures to the correct call site and supports precise positive-plus-negative delegation-shape assertions including task_classification:, which no other pin in the file covers.
