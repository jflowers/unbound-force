---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-19T17:17:22Z
identity: documentation-gate-20261019T171722-jay-flowers
tier: draft
---

Documentation-gate consolidation must be verified against the target issue's body, never against the change's task record. When a user-facing change skips filing a new docs issue and instead references an existing open umbrella issue (search-first anti-duplication), the gate is satisfied only if that umbrella issue's body actually names the change's delta — a task-record reference is a claim, not state. Verification procedure: run `gh issue view <N>` on every referenced issue and check the body/scope table for the change's specific delta; hedge words in task records ('may absorb', 'could absorb') signal an unperformed consolidation. When the body lacks the delta, the fix is a one-line scope edit on the umbrella issue, not a new filing — the unbound-force pattern is #743 item 3, which prescribed editing #739's scope table to name the absorbed unleash-summary artifact contract (and #739's body was duly extended). Repo precedent classifies a missing scope row on an existing umbrella issue as LOW (deferred), while a genuinely missing issue with no umbrella coverage is HIGH. Observed in the clarification-marker-superset review (2026-10-19): task 5.2 recorded that #739/#309 'may absorb' the marker-grammar delta, but neither issue body named it.
