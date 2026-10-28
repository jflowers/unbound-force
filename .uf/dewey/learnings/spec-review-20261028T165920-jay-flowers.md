---
tag: spec-review
author: jay-flowers
category: gotcha
created_at: 2026-10-28T16:59:20Z
identity: spec-review-20261028T165920-jay-flowers
tier: draft
---

Spec impact inventories in unbound-force must include the internal/scaffold/assets mirror tree: every modified .opencode/plugins/*, .opencode/lib/*, .opencode/commands/*, and .uf/schemas/* file has a byte-identical drift-gated mirror (TestSCFR001_CanonicalAssetSurfaceMatchesMirrors and the embedded-asset tests in internal/scaffold/scaffold_test.go), so tasks naming only the working-tree path fail make check when executed literally. New .opencode/lib/ modules consumed by a mirrored plugin additionally require scaffold asset registration (embedded copy plus the 'Shared lib modules' enumeration and its tests) — an unregistered module breaks fresh uf init deployments in a way drift tests cannot catch, since they compare existing pairs rather than missing new assets. Telltale asymmetry when this is missed: the spec cites the scaffold mirror only for files it explicitly does NOT change ('the canonical .uf/review-matrix.yaml and its scaffold mirror are NOT modified') while omitting mirror handling for every file it does change. Note also that the canonical schemas/review-matrix/ registry is the one surface with NO scaffold mirror (mapping removed per TestMapAssetPath), while .uf/schemas/review-matrix/ is the drift-paired deployed copy that needs an explicit sync-or-record decision. Verified in the derive-per-run-timeout spec review (iteration 2, 2026-10-28): the plugin mirror exists at identical line numbers (index.ts:109/232/834/4039/4748), all five command-file mirrors exist, and the omission spanned proposal.md's Impact section and every implementation phase's tasks.
