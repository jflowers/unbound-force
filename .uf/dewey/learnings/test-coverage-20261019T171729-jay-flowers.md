---
tag: test-coverage
author: jay-flowers
category: gotcha
created_at: 2026-10-19T17:17:29Z
identity: test-coverage-20261019T171729-jay-flowers
tier: draft
---

Static single-sourcing guards that count source-text occurrences (e.g., counting the escaped regex literal '\[NEEDS CLARIFICATION' in plugin source to enforce one grammar) are constant-name-agnostic but representation-dependent: an unescaped string constant ('[NEEDS CLARIFICATION'), \x5B escapes, \s-interposed regexes, or RegExp-constructor concatenation all evade the count — and the unescaped-string form is the exact shape of the historical bug (a deleted substring probe). Pair every source-scan guard with a behavioral test that pins the historical regression mode, and scope the guard's comment to what it actually detects (regex-literal grammars in the house style), documenting the residual evasion surface. Verified in opsx/clarification-marker-superset (PR #753): the resume suite's SPEC_WITH_MARKER_LIKE_TEXT test catches the substring-probe regression that the source-scan count alone would miss.
