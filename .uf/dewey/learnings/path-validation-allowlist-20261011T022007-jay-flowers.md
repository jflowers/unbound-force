---
tag: path-validation-allowlist
author: jay-flowers
category: pattern
created_at: 2026-10-11T02:20:07Z
identity: path-validation-allowlist-20261011T022007-jay-flowers
tier: draft
---

When reviewing changes that broaden path validation allowlists (e.g., adding /tmp alongside $TMPDIR), verify three properties: (1) the new directory is canonicalized via realpath() not just resolve(), (2) the prefix check uses path + "/" to prevent partial-path matching (e.g., /tmp-evil matching /tmp), and (3) the exact-match check for the directory itself is also included. The review-dispatch validateDiffPath function demonstrates the correct pattern: try { canonicalSystemTmp = await realpath("/tmp") } catch { canonicalSystemTmp = "/tmp" } with both startsWith(canonicalSystemTmp + "/") and resolved === canonicalSystemTmp checks.
