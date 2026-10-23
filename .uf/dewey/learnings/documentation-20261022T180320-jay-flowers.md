---
tag: documentation
author: jay-flowers
category: gotcha
created_at: 2026-10-22T18:03:20Z
identity: documentation-20261022T180320-jay-flowers
tier: draft
---

Spec-review corollary to learning documentation-gate-20261022T121705-jay-flowers: the "documentation-issue decision" phrasing recurs at spec time (delegation-skill-enforcement tasks.md 5.3, Oct 2026). A spec that labels its own change user-facing but defers issue filing as an open "decision" plans in a gate failure — the executed task gets checked with no issue numbers or exemption rationale, which the Curator code-review check classifies HIGH. Well-formed in-repo precedent: router-pattern-codification task 1.4 committed to filing the docs issue against a named repo with rationale and cross-references, and prior increments recorded both filed issue numbers (unbound-force#739 + website#309 for unleash-deterministic-tools; #728 + website#307 for increment 1). Specs for user-facing workflow changes should encode the tracking-issue gate as committed task(s) naming both targets — a docs-labeled issue in the current repo (AGENTS.md documentation gate) and the website issue in unbound-force/website (org constitution Cross-Repo Documentation rule) — and require recording the filed issue numbers in the task or change record. This is the same MUSTs-in-structure-not-prose principle the determinism pack codifies as DE-008: the decision noun is not the artifact.
