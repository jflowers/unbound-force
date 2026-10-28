---
tag: spec-review
author: jay-flowers
category: gotcha
created_at: 2026-10-28T14:27:30Z
identity: spec-review-20261028T142730-jay-flowers
tier: draft
---

Constitution Alignment sections in spec proposals go stale silently after org constitution amendments. The Unbound Force org constitution v1.4.0 (amended 2026-10-14) defines six active principles, but proposals patterned on older or hero-repo four-principle templates assess only I–IV. Observed in derive-per-run-timeout (created 2026-10-28, 14 days post-amendment): its Constitution Alignment section and its verification task both omitted V (Security by Default) and VI (Deterministic Execution), even though the repo's own prior change record (unleash-deterministic-tools D11, 2026-10-17) already cited Principle VI. When authoring or reviewing spec artifacts, verify the alignment section enumerates every currently active principle — and note that a change advancing a newly added principle (e.g., deterministic tool-layer functions replacing prose-mediated configuration copying) gains its strongest alignment argument by citing it.
