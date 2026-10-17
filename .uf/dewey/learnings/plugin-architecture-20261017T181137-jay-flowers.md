---
tag: plugin-architecture
author: jay-flowers
category: pattern
created_at: 2026-10-17T18:11:37Z
identity: plugin-architecture-20261017T181137-jay-flowers
tier: draft
---

Mirror-synced plugin files multiply file-organization decisions. Splitting a mirrored plugin file (e.g., .opencode/plugins/uf-workflow/index.ts, 3,860 lines) requires lockstep updates to four synchronized surfaces: the canonical .opencode tree, the byte-identical internal/scaffold/assets/ mirror, expectedAssetPaths, and task42CanonicalAssets in internal/scaffold. Two additional constraints: (1) opencode.json registers plugins by directory, so index.ts must remain the barrel entry point — any internal split must re-export through it; (2) the closure test's import grammar (TestStageReviewPluginSources_CoversImportedLibModules) only understands the flat opencode/lib layout, so plugin-internal relative imports (e.g., ./sibling.js) would silently escape the non-flat-import scan — the grammar must be extended before any plugin-internal file split. Plan all of these surfaces together when proposing AP-001-style barrel refactors of plugin files.
