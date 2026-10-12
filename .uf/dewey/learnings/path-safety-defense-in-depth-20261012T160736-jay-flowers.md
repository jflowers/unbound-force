---
tag: path-safety-defense-in-depth
author: jay-flowers
category: pattern
created_at: 2026-10-12T16:07:36Z
identity: path-safety-defense-in-depth-20261012T160736-jay-flowers
tier: draft
---

When implementing filesystem-based state persistence with user-influenced path segments (branch names, command names), a two-layer defense is effective: (1) an allowlist-based sanitization function that strips dangerous characters, and (2) a post-resolution path containment check using `resolve()` + `startsWith(expectedRoot + '/')`. The sanitization layer handles the common case efficiently, while the containment check catches edge cases the sanitization might miss (e.g., `..` sequences when dots are in the allowlist). Both layers should be independently testable. In the uf-workflow checkpoint implementation, the sanitization strips `/` (preventing `../` traversal) while the path check catches any remaining traversal attempts — making the defense robust even if one layer is modified.
