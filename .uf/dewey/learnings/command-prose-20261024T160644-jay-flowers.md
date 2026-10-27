---
tag: command-prose
author: jay-flowers
category: gotcha
created_at: 2026-10-24T16:06:44Z
identity: command-prose-20261024T160644-jay-flowers
tier: draft
---

When a shared procedure block in command prose carries an exclusion clause, every call site's entry condition must encode the matching filter or the exclusion is unenforceable at that site. In /uf.unleash PR #815, "Pre-existing and environmental failures never enter the loop" is satisfiable at the phase checkpoint (verdict "failed" structurally implies a change-caused failure via the existing verdict rule) and at Step 6 (branch-caused filter stated at the gate), but the quick-tier pre-flight gate routes on "any check fails" with no classification step and no inventory in its checkpoint, so the exclusion cannot be applied there as written.
