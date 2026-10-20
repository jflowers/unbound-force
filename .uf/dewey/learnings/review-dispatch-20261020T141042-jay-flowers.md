---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-20T14:10:42Z
identity: review-dispatch-20261020T141042-jay-flowers
tier: draft
---

Running two review dispatches (spec review, then code review) in one opencode session on the same uncommitted branch can produce a consolidated code-review artifact whose session metadata is stale: the artifact recorded mode "specs" and the spec-review change profile (529 lines, 5 files, security_sensitive false) even though the plan, runs, and findings were unambiguously from the 18-file code review dispatched second. This is the dispatch-session-collision class already tracked as unbound-force issues #746/#760 (out of scope for the fix-dispatch-verdict-derivation change), and the vote-based verdict derivation correctly used the actual runs, so the verdict itself was valid. The operational takeaway for /uf.unleash drivers: when a single session performs multiple dispatches, verify the consolidate artifact's mode/change_profile fields reflect the latest dispatch, and record any mismatch as a retrospective finding rather than blocking the pipeline. Related observation from the same run: one reviewer (architect) timed out on a heavy 1255-line 18-file diff; the council still reached a valid APPROVE WITH ADVISORIES from 3 of 4 successful reviewers, confirming that the quorum rule (at least one successful assessment) tolerates individual reviewer failures without invalidating the verdict.
