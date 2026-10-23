---
tag: command-prose
author: jay-flowers
category: pattern
created_at: 2026-10-22T22:50:21Z
identity: command-prose-20261022T225021-jay-flowers
tier: draft
---

When a parent command embeds a human gate owned by another command (e.g. /uf.unleash embedding the council's spec review gate), restating the full option set and gate invariants verbatim in the parent is the correct pattern — citation-only parents risk contradicting the child's gate (see the security-gate-delegation learning, 2026-10-14). To keep the restatement from drifting, back it with structural pin tests that assert the shared fragments (option labels, severity ordering, blocking rules, resume-guard clauses, outcome labeling) in BOTH canonical command assets, so parent/child gate consistency is enforced by make check rather than review vigilance. TestSpecReviewPerFindingGateContracts in internal/scaffold/scaffold_test.go (spec-review-per-finding-gate change) is the shipped precedent; extend the pin set whenever new normative fragments are duplicated across the two commands. (2026-10-22.)
