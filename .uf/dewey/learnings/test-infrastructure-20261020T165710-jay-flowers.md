---
tag: test-infrastructure
author: jay-flowers
category: gotcha
created_at: 2026-10-20T16:57:10Z
identity: test-infrastructure-20261020T165710-jay-flowers
tier: draft
---

Per-file duplication of test-support shims scales silently past the CS-004 extraction threshold: each new plugin test suite copies the established withBun Bun.YAML shim from its neighbors, and after seam-verification (2026-10) added registration-surface.test.ts and golden-output-shape.test.ts, grep counted 8 identical copies across .opencode/test/ (build-review-prompts, plugin-integration, dispatch-status, submit-tools, dispatch-review-runs, scratch-smoke pre-existing). The adding change is the extraction point per the repo's own heuristic (plugin-architecture-20261017T123523): when a new suite would copy a helper that already exists in more than two test files, extract it to a shared module under .opencode/test/ in the same change and import it; pre-existing copies migrate opportunistically. Reviewer check: run grep for "function <helperName>" across .opencode/test/ before accepting a new suite's copied setup block — a copy whose own comment cites "same pattern as <precedent files>" is the tell that the threshold is already crossed.
