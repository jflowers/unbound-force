---
tag: scaffold-cleanup
author: jay-flowers
category: gotcha
created_at: 2026-10-11T01:37:29Z
identity: scaffold-cleanup-20261011T013729-jay-flowers
tier: draft
---

When performing large-scale removal of heroes/packages from the unbound-force codebase, the scaffold_test.go knownNonScaffolded map (aka knownExternalFiles) is a frequently missed cleanup target. This map contains entries for files that exist locally but are NOT produced by uf init (e.g., muti-mind commands, workflow commands, gaze commands). When the referenced files are deleted, these map entries become dead code. Always grep scaffold_test.go for the removed hero/feature name after deletion.
