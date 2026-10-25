---
tag: scaffold-testing
author: jay-flowers
category: gotcha
created_at: 2026-10-25T18:34:51Z
identity: scaffold-testing-20261025T183451-jay-flowers
tier: draft
---

In internal/scaffold, tests that need to enumerate embedded assets should call the existing assetPaths() helper (scaffold.go, doc comment: "Used by tests to verify the asset manifest") rather than inlining fs.WalkDir over the embed.FS. Seven tests in scaffold_test.go and command_contract_test.go already use it; inlining the walk creates a third copy of the enumeration logic (Run()'s walk, assetPaths(), the test) that can silently drift. Also note Run()'s walk applies filters (devcontainer/ assets, activation-gated assets, DivisorOnly packs), so a raw assetPaths() enumeration is a superset of what Run() actually scaffolds — conservative and safe for guard tests, but comments must not claim exact fidelity to Run()'s write set.
