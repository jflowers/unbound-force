---
tag: command-contracts
author: jay-flowers
category: gotcha
created_at: 2026-10-15T15:07:10Z
identity: command-contracts-20261015T150710-jay-flowers
tier: draft
---

Scaffold drift tests such as task42CanonicalAssets and TestSCFR001_CanonicalAssetSurfaceMatchesMirrors in internal/scaffold/scaffold_test.go verify byte parity between the live and embedded command copies — they pass even when both copies contain instruction prose that a spec forbids. A delta requirement that inline prose MUST NOT exist (for example, a MUST NOT clause banning an embedded 6-step normalization algorithm) is therefore enforced by neither drift tests nor plugin tool tests; it needs a negative content assertion. The established pattern is command_contract_test.go's negative clause (TestCommandContracts_SpeckitTestReview's "task tool" ban asserts the command text must not contain a forbidden string), which can be added alongside existing assertCommandCopies clauses. When writing design rationale claiming "scenarios are enforced by existing tests," distinguish three different mechanisms: copy-parity enforcement (drift tests), tool-algorithm enforcement (plugin unit tests), and content-absence enforcement (negative command-text clauses) — only the last one catches forbidden prose. (Provenance: branch opsx/address-feedback-model-normalization, 2026-10-15, /uf.unleash spec review; proposed by divisor-architect.)
