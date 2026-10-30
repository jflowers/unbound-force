---
tag: scaffold-mirrors
author: jay-flowers
category: pattern
created_at: 2026-10-30T21:22:23Z
identity: scaffold-mirrors-20261030T212223-jay-flowers
tier: draft
---

In the unbound-force repo, scaffold mirror sync for changed `.opencode/` assets can be verified directly from the diff without reading files: canonical and mirror paths must stay byte-identical, and git's content-addressed blob hashes make the `index <old>..<new>` lines on each side of a mirrored pair a zero-read proof — matching hash pairs prove both the before and after states are byte-identical. Files without a mirror need no sync: `internal/scaffold/assets/opencode/` mirrors only `uf.*` commands plus `lib/`, `plugins/`, and `uf/packs/`; `speckit.*` and `opsx-*` commands are deployed by their own frameworks (specify/openspec CLIs), not by `uf init`. Combine the diff hash check with the scaffold drift test suite for full coverage.
