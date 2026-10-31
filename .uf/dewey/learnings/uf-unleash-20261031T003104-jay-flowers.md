---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-31T00:31:04Z
identity: uf-unleash-20261031T003104-jay-flowers
tier: draft
---

During the opsx/review-dispatch-diff-manifest change (GitHub issue #877, resumed 2026-10-31), the previous /uf.unleash cycle was killed by the session delegation cap after consolidate_dispatch had finalized the code-review dispatch (artifact .uf/artifacts/dispatch/5ecb607d-5ed0-44c6-bd24-69c13030962c.json, verdict APPROVE WITH ADVISORIES) but before the code-review checkpoint was written, leaving durable state claiming every step except code review. The correct recovery, verified on this resume: uf_unleash_detect_resume derives code-review completion from the dispatch artifact itself (approving verdict plus recorded head SHA equal to current HEAD 4298b24f), so the resume recorded the missing checkpoint directly from the artifact's payload instead of re-dispatching five Divisor reviewers. Lesson: treat consolidation and checkpoint recording as one logical transaction — record the review-loop checkpoint immediately after consolidate_dispatch returns — and on any interrupted resume, treat the persisted dispatch artifact under .uf/artifacts/dispatch/ as the authoritative evidence of review completion over missing checkpoint state.
