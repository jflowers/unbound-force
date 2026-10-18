---
tag: review-process
author: jay-flowers
category: pattern
created_at: 2026-10-17T23:47:14Z
identity: review-process-20261017T234714-jay-flowers
tier: draft
---

When reviewing a prose-rewrite pilot that carries a behavioral-preservation contract (e.g., command-prose-pilot D12), hardcoded environment-specific values inside rewritten lines — such as a fixed PR target repo and a personal fork head (jflowers:<branch>) in a tool-owned command asset scaffolded to every hero repo via uf init — are deliberately carried through, not introduced by the change. The original design decision is traceable (run-plan-command's tasks.md specified the PR-target rule verbatim), so the correct review output is a LOW advisory routing parameterization to the phased rollout backlog or the change's docs issue, not a blocking finding: fixing it mid-pilot would violate the preservation contract the spec review already approved. The advisory's action is "record the debt in a follow-up" — check the change's follow-on records (metrics.md follow-ups, proposal follow-ons, docs issue) first, and when none tracks it, that gap is the finding.
