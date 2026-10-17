---
tag: scaffold-staging
author: jay-flowers
category: gotcha
created_at: 2026-10-17T03:36:10Z
identity: scaffold-staging-20261017T033610-jay-flowers
tier: draft
---

Regex-based import-closure walks in drift-detection tests must cover every relative-prefix form the contemplated module layout can produce, not just the forms present today. In PR 745 round 2, the staging-closure test in internal/scaffold/plugin_activation_test.go broadened its specifier character class to [A-Za-z0-9._/-] so nested lib paths (lib/sub/mod.js) are admitted, and its comment explicitly anticipates nested modules — but the local-import regex `["']\./([A-Za-z0-9._/-]+)\.js["']` still requires a literal `./` after the quote. A parent-relative import (`../shared.js`) from inside a nested module does not match, so the referenced module silently escapes the closure and a staging gap for it fails open. Detection heuristic: when a traversal regex's character class admits `/` (nested paths), audit the matched prefix grammar for `../` as well; the safe ordering is to decide the supported module-layout grammar first (flat-only vs nested), then make the regex and its doc comment state the same layout. Latent fail-open holes in closure tests are only visible by diffing the layout the comment claims against the grammar the regex actually accepts.
