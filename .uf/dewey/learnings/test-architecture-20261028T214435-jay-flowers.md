---
tag: test-architecture
author: jay-flowers
category: gotcha
created_at: 2026-10-28T21:44:35Z
identity: test-architecture-20261028T214435-jay-flowers
tier: draft
---

A retrospective learning captured during a change's own workflow that recommends a stronger test pattern for that change's deliverable creates an actionable obligation in the introducing change while it is still open — shipping the learning as prose while the code ships the weaker sanctioned path selects that path by omission rather than by decision. Verified on port-uf-rebase-pr post-PR review (2026-10-28): the test-architecture learning committed in the PR names uf.rebase-pr's force-push bounds as its example and directs asserting the load-bearing guardrail phrases 'in the introducing change', but the change landed only expectedAssetPaths registration plus parity/count coverage; symmetric loss of the never-force / never-push-base guardrails from both mirror copies remains invisible to every gate, and no design.md rationale records a deliberate choice of the parity-only path. Reviewer check: when a PR's own newly committed learning cites that PR as its example, diff the learning's recommendation against the PR's test surface before approving — either implement the recommendation in the PR or require an explicit recorded decision (with rationale) for the weaker path.
