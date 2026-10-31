---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-31T00:35:54Z
identity: review-dispatch-20261031T003554-jay-flowers
tier: draft
---

Golden-test line-number site labels drift stale independently of any single change's diff, so a label-refresh task must re-derive every label in the touched files from actual file content rather than applying the diff's line shift — and a reviewer must judge the result accordingly. Verified while reviewing forward-aggregate-correlation-id (2026-10-30): golden-output-shape.test.ts labels moved by far more than the diff's shift (resolve_base_ref uf.review-council.md 126→132 although that file's first edit lands at line 280; normalize_model_name uf.address-feedback.md 801→910 although the diff adds only 19 lines after 384; get_progress uf.unleash.md 55→87 although the first edit lands at 680), because the old labels were stale from earlier edits and the refresh re-located them. Review technique for refreshed labels: (1) hunk-adjacent labels must sit against their hunk boundaries (plan_review_dispatch uf.unleash.md:665 just above the hunk starting at 680; consolidate_dispatch uf.review-council.md:424 inside the hunk starting at 422); (2) labels in unedited regions of edited files may legitimately move when they were stale — movement without a corresponding hunk is re-derivation, not corruption; (3) two comment blocks previously citing divergent lines for the same documented site converging on one value (review-council's dispatch_review_runs documentation: 276 and 256 both became 260) is the signature of re-derivation.
