---
tag: spec-writing
author: jay-flowers
category: gotcha
created_at: 2026-10-28T16:59:10Z
identity: spec-writing-20261028T165910-jay-flowers
tier: draft
---

When a requirement clamps a derived value to a ceiling, scenario THEN-clauses comparing effective values must survive saturation: assert >= and reserve strict > for below-the-ceiling cases. The largest inputs — the motivating cases for the feature — are exactly the ones that clamp (derive-per-run-timeout RD-FR-028: a 1200 s base + heavy tier + prompt above ~264 KiB clamps both the contention and no-contention derivations to the 1800 s ceiling, making "strictly greater" false for precisely the largest panels).
