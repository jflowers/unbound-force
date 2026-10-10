---
tag: review-dispatch-scope
author: jay-flowers
category: context
created_at: 2026-10-10T17:26:39Z
identity: review-dispatch-scope-20261010T172639-jay-flowers
tier: draft
---

The review council planner classifies test files under test-quality focus but the categories assigned to the change profile are based on planner policy, not path heuristics. A TypeScript-only change with test files may not include test-quality in the change categories, causing divisor-testing to be scope-missed. The Adversary still reviews security aspects of test files, and the Architect reviews test organization.
