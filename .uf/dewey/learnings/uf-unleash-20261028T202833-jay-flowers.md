---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-28T20:28:33Z
identity: uf-unleash-20261028T202833-jay-flowers
tier: draft
---

uf.unleash review-step completion is derived from dispatch artifacts, not checkpoint claims. Verified on port-uf-rebase-pr (2026-10-28): the prior session consolidated the code-review council to APPROVE WITH ADVISORIES but ended before recording the code-review checkpoint step, so get_progress reported checkpoint_claims.code_review false with resume_from "code_review"; uf_unleash_detect_resume nonetheless reported every step complete because the dispatch artifact under .uf/artifacts/dispatch/ records the approving verdict with a head SHA equal to current HEAD (code-mode freshness rule). When resuming a pipeline, never re-run a completed review step solely because its checkpoint is missing — probe the dispatch artifacts first, since artifact evidence is authoritative and a missing checkpoint claim is not evidence of incomplete work. The inverse also holds: a checkpoint claim without a matching approving artifact reports the review step incomplete, so record the checkpoint after consolidation to keep both signals aligned.
