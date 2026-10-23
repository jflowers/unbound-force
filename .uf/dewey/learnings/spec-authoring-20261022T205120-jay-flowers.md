---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-22T20:51:20Z
identity: spec-authoring-20261022T205120-jay-flowers
tier: draft
---

When a tool contract adds parameters coupled to an enum classification, enumerate the cross-field validation rules against every combination of the new optional parameters, not just the escape-hatch parameter — and audit any fixed output wording that restates an input field's value. In the delegation-skill-enforcement change (issue #787), only `skill_absent_reason` was coupled to the `deterministic` classification; `skill` remained valid on judgment-classified and unclassified command-path calls, while the fixed prompt-directive wording ('This task is classified as deterministic work...') asserts deterministic classification for every skill-bearing call. The golden-shape tests would have pinned the contradiction. Rule of thumb: for each fixed output template that restates field X, enumerate the schema-valid inputs where X is absent or differs before making the wording a design constant.
