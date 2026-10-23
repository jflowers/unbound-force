---
tag: test-quality
author: jay-flowers
category: gotcha
created_at: 2026-10-22T22:50:19Z
identity: test-quality-20261022T225019-jay-flowers
tier: draft
---

When rewording prose that is pinned by structural contract tests, re-derive the pin set from the governed invariants, not just from the new text. In the unbound-force spec-review-per-finding-gate change (2026-10-22), rewriting the review-council's auto-fix boundary sentence from 'LOW/MEDIUM auto-fix and HIGH/CRITICAL report only' to 'the autonomous auto-fix boundary remains LOW/MEDIUM only' forced the contract-test fragments 'low/medium auto-fix' and 'high/critical report only' to be dropped — and nothing replaced them, leaving a protected governance gate (the autonomous auto-fix boundary, severity.md Auto-Fix Policy table) with zero regression coverage. Rule: when a contract-clause rewrite removes fragments, diff the removed fragments' invariants against the new fragment set and add a replacement pin (or a policy-table-row pin) for every invariant that must survive the rewording; a presence-only pin on the new text does not protect the old invariant.
