---
tag: issue-triage
author: jay-flowers
category: pattern
created_at: 2026-10-22T21:20:21Z
identity: issue-triage-20261022T212021-jay-flowers
tier: draft
---

Triage pattern for refactoring issues (verified on unbound-force #782, plugin helper extraction): verify four points before accepting "no behavior changes / tests unchanged" as enforceable acceptance criteria. (1) The named symbols exist at the claimed locations — findIssueReference/parseGhIssuePayload confirmed inline in uf-workflow/index.ts:1358/1381 and the duplicated reader path/guards in uf-finale/index.ts:411-425. (2) The cited precedent exists in BOTH the live and scaffold-mirror trees (.opencode/lib/branch-classification.ts ↔ internal/scaffold/assets/opencode/lib/). (3) The extraction target's mirror surface exists, so drift tests will cover the new file. (4) The symbols to be moved already have test coverage that survives a pure move — .opencode/test/unleash-resolve-issue.test.ts dedicates six describe blocks to uf_unleash_resolve_issue, and the .uf/progress/<slug>/uf.unleash.json path template is asserted independently in 8+ test files (including the #707 writer-reader connecting test in uf-finale.test.ts). When all four verify, acceptance criteria are machine-enforceable (make plugin-test + drift tests) and the issue triages as VALID without implementation review. Corollary: test files that hardcode the expected path/value in their own assertions (rather than importing the production helper) act as extraction-independent oracles — they keep passing through a pure move but fail if the move changes semantics, which is exactly the property a no-behavior-change refactor needs.
