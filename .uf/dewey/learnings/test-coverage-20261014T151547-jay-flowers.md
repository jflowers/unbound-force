---
tag: test-coverage
author: jay-flowers
category: gotcha
created_at: 2026-10-14T15:15:47Z
identity: test-coverage-20261014T151547-jay-flowers
tier: draft
---

In the unbound-force meta repo, every .opencode/test/*.test.ts plugin test runs against a mkdtemp scratch fixture project — none execute against the real repository root. Plugin tests therefore verify mechanisms (e.g., "every .md in .opencode/uf/packs flows into review prompts" is asserted via SAMPLE_PACK content in build-review-prompts.test.ts) but can never verify that a real repo artifact (a newly added convention pack or skill) is included; adding a repo pack cannot break any plugin golden. Acceptance scenarios about real repo artifacts must either be pinned with a Go test that walks the real tree (follow the TestCanonicalSources_AreEmbedded findProjectRoot precedent in internal/scaffold/scaffold_test.go) or be accepted as compositionally verified (fixture mechanism test + drift-test presence walk). Deterministic doc-artifact invariants that currently lack CI pins: the AGENTS.md Convention Packs listing vs the .opencode/uf/packs directory (a set-comparison; the agentsmdPackMarker constant already exists in scaffold.go), and .opencode/skills/*/SKILL.md frontmatter validity (doctor's validateSkills covers this at runtime only, not in CI).
