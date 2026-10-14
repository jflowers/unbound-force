---
tag: scaffold
author: jay-flowers
category: pattern
created_at: 2026-10-14T15:15:15Z
identity: scaffold-20261014T151515-jay-flowers
tier: draft
---

Repo-local files under .opencode/ (packs, skills, commands) that have no scaffold asset counterpart MUST be registered in knownNonEmbeddedFiles in internal/scaffold/scaffold_test.go, or TestCanonicalSources_AreEmbedded fails on make test. This is the sanctioned mechanism for shipping repo-local governance artifacts while keeping the uf init scaffold frozen (verified precedents: speckit/opsx/gaze/replicator/dewey commands, dcp.jsonc, and the determinism pack/skill). The analogous registration point for non-coding convention packs is the inline skip chain in TestValidateConventionPack_AllPacksValid (internal/schemas/packvalidator_test.go) with a rationale comment — severity.md, content.md, ci.md, and now determinism.md all use it.
