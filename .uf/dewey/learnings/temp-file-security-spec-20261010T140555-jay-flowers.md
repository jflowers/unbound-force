---
tag: temp-file-security-spec
author: jay-flowers
category: pattern
created_at: 2026-10-10T14:05:55Z
identity: temp-file-security-spec-20261010T140555-jay-flowers
tier: draft
---

Temp file specifications in OpenSpec/Speckit artifacts must address three security properties beyond permissions: (1) symlink defense via O_NOFOLLOW or equivalent flags, (2) atomic write semantics via O_CREAT|O_EXCL or temp-file-then-rename, and (3) path canonicalization via fs.realpath() (not path.resolve()) on platforms where $TMPDIR traverses symlinks (macOS /var → /private/var). The council-review-action O_NOFOLLOW usage and the path-validation-nodejs learning are the canonical references.
