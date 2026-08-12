---
tag: scaffold-testing
author: jay-flowers
category: gotcha
created_at: 2026-08-12T17:58:47Z
identity: scaffold-testing-20260812T175847-jay-flowers
tier: draft
---

When adding `.opencode/skills` to the reverse-drift test's canonicalDirs in scaffold_test.go, all skill directories under .opencode/skills/ are now walked. Any skill file not in expectedAssetPaths or knownNonEmbeddedFiles will fail the test. Must add all non-scaffolded skills (openspec-*, replicator-scaffolded, etc.) to knownNonEmbeddedFiles. Also must add a hidden-file skip (strings.HasPrefix(info.Name(), ".")) to the walk callback to handle .DS_Store files that macOS creates.
