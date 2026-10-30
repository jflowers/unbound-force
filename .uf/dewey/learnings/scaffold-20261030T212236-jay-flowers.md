---
tag: scaffold
author: jay-flowers
category: reference
created_at: 2026-10-30T21:22:36Z
identity: scaffold-20261030T212236-jay-flowers
tier: draft
---

In unbound-force/unbound-force, only uf.* commands under .opencode/commands/ are embedded scaffold assets (internal/scaffold/assets/opencode/commands/, 13 files) bound to byte-identical mirrors enforced by TestEmbeddedAssets_MatchSource plus the reverse drift detection over expectedAssetPaths. The speckit.*, opsx-*, and other non-uf commands are repo-local with no mirror obligation. When reviewing .opencode/commands/ changes in this repo, glob internal/scaffold/assets/opencode/ first — only files present in the embedded tree require a synchronized mirror edit; flagging drift on non-embedded commands is a false positive.
