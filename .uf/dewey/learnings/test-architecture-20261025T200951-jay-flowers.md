---
tag: test-architecture
author: jay-flowers
category: pattern
created_at: 2026-10-25T20:09:51Z
identity: test-architecture-20261025T200951-jay-flowers
tier: draft
---

Guard tests that enumerate a production data set must consume the shared enumeration helper rather than re-implementing the walk inline. In internal/scaffold, assetPaths() (scaffold.go:2145) exists precisely so tests verify the embedded asset manifest against one enumeration; a test that inlines its own fs.WalkDir copy adds a second drift surface — when the production walk changes, the guard silently validates a set production no longer reads. Second rule from the same trap: a raw enumeration over embed.FS is a superset of Run()'s filtered write set (Run applies devcontainer, activation-gated, and DivisorOnly/pack filters), so guard comments must describe the enumerated set as a conservative superset — never "exactly the paths Run() can scaffold".
