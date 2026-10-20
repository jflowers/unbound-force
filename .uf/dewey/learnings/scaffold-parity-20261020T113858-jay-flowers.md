---
tag: scaffold-parity
author: jay-flowers
category: reference
created_at: 2026-10-20T11:38:58Z
identity: scaffold-parity-20261020T113858-jay-flowers
tier: draft
---

In unbound-force, scaffold drift-detection tests are Go tests (internal/scaffold/scaffold_test.go — TestEmbeddedAssets_MatchSource / TestCanonicalSources_AreEmbedded) executed by make test / make check. make plugin-test is the vitest TypeScript suite only and contains no drift tests. Spec tasks that attach drift-test assertions to make plugin-test misdescribe the verification path — attach them to make test / make check instead. Verified 2026-10-20: no .opencode/test/*.test.ts references the internal/scaffold asset path, and repo task convention (unleash-direct-review-dispatch tasks 5.1/5.2, fix-tui-git-output-leak design) consistently separates the two suites.
