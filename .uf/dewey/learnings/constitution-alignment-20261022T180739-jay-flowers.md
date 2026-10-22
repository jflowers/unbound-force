---
tag: constitution-alignment
author: jay-flowers
category: gotcha
created_at: 2026-10-22T18:07:39Z
identity: constitution-alignment-20261022T180739-jay-flowers
tier: draft
---

Constitution-alignment PASS justifications in spec proposals must be checked against the change's own design risk register before they are trusted. In the ts-plugin-coverage-gate change, proposal.md's Principle VI (Deterministic Execution) assessment claimed "same-commit coverage measurement is deterministic, so the gate cannot pass locally and fail in CI for environmental reasons," while design.md's Risks section documented cross-platform V8 coverage divergence (macOS local vs ubuntu-latest CI — the same class that forced a 0.5 epsilon in ci_crapload.yml) and relied on a 1.18-point margin to absorb it. The reliable pattern: ground each constitution PASS in the documented mitigation (identical enforcement command, checked-in value, absorbing margin, CI run as platform confirmation) rather than in a denial that the risk exists. Reviewers should diff every PASS justification against the design's risk register for contradictory overclaims.
