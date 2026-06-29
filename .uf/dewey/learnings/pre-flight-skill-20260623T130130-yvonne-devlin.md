---
tag: pre-flight-skill
author: yvonne-devlin
category: gotcha
created_at: 2026-06-23T13:01:30Z
identity: pre-flight-skill-20260623T130130-yvonne-devlin
tier: draft
---

When adding a new scaffold asset (e.g., a new skill file under .opencode/skills/), the expectedAssetPaths list in scaffold_test.go is not the only place that needs updating. The TestRunInit_FreshDir test in cmd/unbound-force/main_test.go hardcodes the total file count produced by uf init (e.g., "39 files processed"). Adding a scaffold asset bumps this count. The scaffold-specific tests (TestEmbeddedAssets_MatchSource, TestAssetPaths_MatchExpected) will pass because they verify structure, not count — but the integration test in cmd/unbound-force will fail. Always run the full make check (or at minimum go test ./cmd/unbound-force/...) after adding scaffold assets, not just the scaffold package tests.
