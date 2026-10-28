---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-28T17:34:24Z
identity: spec-authoring-20261028T173424-jay-flowers
tier: draft
---

Cross-artifact enumeration drift survives individual plausibility: in the port-uf-rebase-pr OpenSpec change, design.md described the command as having "six phases" while its own phase-ordering parenthetical, the proposal's behavior list, and the delta spec's requirements all used a nine-step granularity — each artifact read fine in isolation because line wrapping split "six" and "phases" onto adjacent lines in tasks.md, defeating single-line grep. When reviewing spec artifact sets, diff the same enumerated concept (phase counts, guardrail counts, requirement counts, error texts) across proposal/design/tasks/spec explicitly, and treat a fallback-contract description that summarizes by counts ("captures six phases and error text") as a claim to verify against what the fallback artifact literally enumerates. Factual claims about repo state (file counts like 32→33 commands and 11→12 scaffold assets, test names, docs table formats, precedent change names, .git/info/exclude entries) were all verifiable and accurate — the drift lived only in the intra-change descriptions.
