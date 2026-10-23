---
tag: opsx-spec-review-per-finding-gate
author: jay-flowers
category: pattern
created_at: 2026-10-22T22:50:39Z
identity: opsx-spec-review-per-finding-gate-20261022T225039-jay-flowers
tier: draft
---

First full-pipeline execution of the per-finding spec-review decision gate (unbound-force opsx/spec-review-per-finding-gate, 2026-10-22) validated the protocol's ergonomics and revealed its tuning points. The gate worked as designed: 15 spec findings were presented in severity order with the human overriding one HIGH (documentation-gate, "not substantial enough"), fixing two individually (F2/F3), and taking the bulk shortcut at the fourth finding (F4, MEDIUM) to consent to all remaining LOW/MEDIUM fixes at once — the bulk shortcut is the load-bearing usability valve; without it a 15-finding review would require 15 sequential questions. The override-carry-forward rule (same file and root cause) proved necessary immediately: the code-review iteration then re-reported the same docs-gate subject as C1 (HIGH) and C4 (MEDIUM), and the carry-forward rule let those resolve against the recorded override without re-asking the human — the rule must be defined before the first override, not after the first re-report. Iteration dynamics across modes: spec review went 15 findings (REQUEST CHANGES) → fixes → 6 advisories (APPROVE WITH ADVISORIES); code review went 8 findings (REQUEST CHANGES, 1 HIGH) → delegated fixes → 9 advisories (APPROVE WITH ADVISORIES); two iterations per mode sufficed. Operational notes: recording the override in checkpoint data with severity/description/justification made it durable across compressions and review modes; delegating the bulk-fix application to cobalt-crush-dev in one prompt (all findings + verified fragments list) was dramatically cheaper than per-finding delegation; and the post-approval advisory set naturally concentrates in test-pin hardening suggestions, which are safe to defer to the docs issue (#789) rather than block the pipeline.
