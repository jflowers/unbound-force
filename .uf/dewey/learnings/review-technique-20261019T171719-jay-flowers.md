---
tag: review-technique
author: jay-flowers
category: pattern
created_at: 2026-10-19T17:17:19Z
identity: review-technique-20261019T171719-jay-flowers
tier: draft
---

Mirror-pair byte-identity can be verified directly from a unified diff without reading either file: scaffold-mirrored repositories render every changed file with an `index <old-blob>..<new-blob>` header, and git blob hashes are content addresses — when a canonical path and its scaffold mirror path show the identical old/new blob pair (e.g., .opencode/plugins/uf-workflow/index.ts and internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts both `b6ed45ac..d1414c62`), byte-identity is cryptographically proven. In the clarification-marker-superset review (2026-10-19) all five changed mirror pairs (plugin index.ts, uf.unleash.md, unleash-templates.ts, package.json, package-lock.json) matched on both blob hashes, corroborating the passing drift tests at zero context cost. Check the blob pairs before spending tokens reading both copies; a mismatch is proof of drift even when the test suite is green, and matching hashes let the reviewer confine file reads to the canonical copy.
