---
tag: adversary-provider-failure
author: jay-flowers
category: gotcha
created_at: 2026-10-29T06:15:39Z
identity: adversary-provider-failure-20261029T061539-jay-flowers
tier: draft
---

In both review dispatches for the opsx/uf-fix-ci change (unbound-force repo, October 2026 — specs-mode artifact b29d5558-2a13-45b6-808e-c7e8af2a01c7 and code-mode artifact 5c9a0080-11c6-4689-af13-5e7ef823b236), the divisor-adversary run on google-vertex-anthropic/claude-opus-4-6@default failed within milliseconds with child_prompt_failed ("Unexpected server error", retryable), while the architect, curator, guard, and testing runs on the parent session's provider succeeded and returned verdicts. Consolidation excludes findings and lesson proposals harvested from non-success runs, so the council verdict still formed from the three-to-four successful assessments — APPROVE WITH ADVISORIES in both modes. The pattern to remember: a single adversary provider failure does not block a review verdict; do not halt the pipeline or hand-roll a replacement review when the remaining reviewers succeed. If adversary coverage is essential for a security-sensitive change, redispatch_failed_runs from a fresh parent session targets exactly the failed runs and nothing else.
