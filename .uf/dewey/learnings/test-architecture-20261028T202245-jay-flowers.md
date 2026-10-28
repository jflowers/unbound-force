---
tag: test-architecture
author: jay-flowers
category: gotcha
created_at: 2026-10-28T20:22:45Z
identity: test-architecture-20261028T202245-jay-flowers
tier: draft
---

Two coexisting precedents govern regression protection for instruction-artifact (command markdown) content in unbound-force, and they protect different things. Drift-parity tests (TestEmbeddedAssets_MatchSource, TestAssetPaths_MatchExpected) verify equality between the canonical .opencode/ copy and the internal/scaffold/assets/ mirror — not the presence of required content in either. Symmetric degradation (a future edit dropping guardrail or convention text from BOTH copies) passes every parity, registration, and count test. The stronger precedent lives in the same test file: TestSpecReviewPerFindingGateContracts and TestUnleashCommand_ToolRoutingContracts pin site-unique phrases in command markdown (session-resume guards, severity rules, delegation call shapes) with the stated design "Each phrase is site-unique so deleting one wiring fails this subtest"; TestDeterminismPack_DE008SpawnToolParameters and TestDivisorGuard_DelegationDisciplineSpawnParameters extend the pattern to agent and pack files. Meanwhile address-feedback-compression-guards shipped guard content with drift-parity + manual validation only, so both paths are sanctioned. Reviewer check: when a change introduces a command whose guardrails bound destructive git operations (e.g., force-push history rewrite in port-uf-rebase-pr), evaluate whether the pin precedent should apply — assert the load-bearing phrases (protect-block delimiters, session-resume guard, validation regex, force-with-lease-never-force, never-push-base) in the introducing change, because parity tests cannot detect symmetric content loss on safety-critical instruction text.
