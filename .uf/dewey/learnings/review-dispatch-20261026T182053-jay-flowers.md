---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-26T18:20:53Z
identity: review-dispatch-20261026T182053-jay-flowers
tier: draft
---

google-vertex-anthropic/claude-opus-4-6 child review sessions can fail persistently with child_prompt_failed "Unexpected server error" (usage null, failing in under a second, marked retryable) while enmaas standard-tier reviewers on the same dispatch all succeed — a provider-side outage, not a prompt or plan defect. Observed on 2026-10-26 in unbound-force/unbound-force: five identical adversary failures across two dispatches (spec review and code review) spanning ~3 hours. Recovery recipe: attempt redispatch_failed_runs once to confirm persistence, then consolidate_dispatch with the successful runs (3/4) — the council verdict remains valid with successful reviewer assessments; do not keep burning redispatch rounds on identical instant failures, and record the outage in the checkpoint note so the final report can disclose the reduced panel.
