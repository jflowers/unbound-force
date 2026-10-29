---
tag: review-technique
author: jay-flowers
category: pattern
created_at: 2026-10-29T15:56:28Z
identity: review-technique-20261029T155628-jay-flowers
tier: draft
---

To verify scaffold-mirror byte-identity during review without reading every copy: inspect the diff's `index <old>..<new>` blob hashes. When the same new blob hash appears at every mirror location for a file (e.g., run-timeout.ts blob b243d2d7 in .opencode/lib/ and internal/scaffold/assets/opencode/lib/; v3.schema.json blob 2f7c79c1 across schemas/, .uf/schemas/, and the embedded registry), the copies are byte-identical by git content addressing. New files show 0000000 as the old hash; mirrors absent from the diff were already synced. This turns mirror-sync verification from repeated file reads into diff inspection.
