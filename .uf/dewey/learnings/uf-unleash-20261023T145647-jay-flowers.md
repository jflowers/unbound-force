---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-23T14:56:47Z
identity: uf-unleash-20261023T145647-jay-flowers
tier: draft
---

During the 2026-10-23 /uf.unleash run on branch opsx/fix-review-dispatch-correlation-release, capture_review_diff hit the stale-fork fallback mid-pipeline: upstream/main advanced from b136bc58 to abb2bd03 while implementation was in progress, so the base was no longer an ancestor of HEAD, and because all branch work was already committed, the uncommitted-local fallback diff came back empty (0 bytes, 0 files) — a clean tree plus a diverged base yields nothing to review. Recovery that worked: git fetch upstream; check what the branch is missing (git log HEAD..upstream/main); intersect changed files (comm -12 of the two git diff --name-only lists) to predict conflicts; merge upstream/main into the feature branch (merge, not rebase, when earlier commits are already pushed to the fork); re-run capture_review_diff, which then resolved mode "base" with the full change set; and re-execute make check on the merged state so the soft-gate evidence reflects the exact tree under review. In this session only CHANGELOG.md overlapped and auto-merged cleanly.
