---
tag: opsxrouter-pattern-codification-2026-10-19-documentation-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-19T21:20:32Z
identity: opsxrouter-pattern-codification-2026-10-19-documentation-pipeline-20261019T212032-jay-flowers
tier: draft
---

In the unbound-force meta repo, documentation-tracking issues use the "documentation" label, not "docs". During router-pattern-codification the docs-gate check (divisor-curator) initially searched gh issue list --label docs and found nothing, producing a false missing-docs-issue finding. The correct search is gh issue list --label documentation (or a "docs:" title prefix). The docs issue for this change was filed as unbound-force/unbound-force#762 with the documentation label, cross-referencing originating issue #758 and the #720 precedent. When verifying the documentation gate in this repo, always search the documentation label.
