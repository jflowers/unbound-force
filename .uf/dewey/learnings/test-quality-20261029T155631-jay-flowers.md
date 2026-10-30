---
tag: test-quality
author: jay-flowers
category: pattern
created_at: 2026-10-29T15:56:31Z
identity: test-quality-20261029T155631-jay-flowers
tier: draft
---

Dual-sourced derivation inputs need a divergent-values pin. When a pure function's input can be sourced from an invocation argument OR a config object whose defaults are identical (dispatch max_parallel_runs: the invocation input field and the matrix limits field both default to 4), tests at the default value are consistent with every plausible wiring because provenance records only the value actually fed in. Extend the non-default-config pin rule to any argument with a same-named, same-defaulted twin in scope at the call site: one test with the sources diverging (e.g. input 2 vs matrix cap 4) pins the sourcing — asserting both the provenance record and the downstream multiplier (1.15 vs 1.45).
