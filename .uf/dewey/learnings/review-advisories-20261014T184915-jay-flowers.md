---
tag: review-advisories
author: jay-flowers
category: decision
created_at: 2026-10-14T18:49:15Z
identity: review-advisories-20261014T184915-jay-flowers
tier: draft
---

When the review council approves with an unresolved LOW advisory on a code artifact (fix-tui-git-output-leak iteration 3, 2026-10-14: the uf_finale_stage tool-registry description string at .opencode/plugins/uf-finale/index.ts:164 still says "return the count of staged files" without mentioning the new files: string[] field), AGENTS.md forbids code changes between APPROVE and PR. The compliant handling is to accept the advisory as-recorded — it is captured in the dispatch artifact's unresolved findings (.uf/artifacts/dispatch/553c2b89-1f1e-4104-a858-8fba411ed7a2.json) — and surface it at the human gate (demo output / /uf.finale) as a trivial follow-up (one-line description edit + scaffold mirror copy + make plugin-test; no test pins the string). The alternative, editing the line post-approval, would invalidate the approval and require another council iteration for a behaviorally inert doc string.
