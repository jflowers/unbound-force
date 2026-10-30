---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-19T16:11:23Z
identity: review-dispatch-20261019T161123-jay-flowers
tier: draft
---

Review-dispatch first-wins session-metadata bug (opsx/clarification-marker-superset, 2026-10-19): when dispatch_review_runs is invoked into an already-resolved dispatch session (same correlation id), it writes the new run files into the session directory under $TMPDIR/opencode/dispatch-<correlation>/ but does NOT overwrite session-metadata.json — the finalizer then validates the new runs against the FIRST dispatch's plan and rejects included reviewers with "run <id> has no included plan entry", producing a failed INCONCLUSIVE consolidation with no persisted artifact. Diagnosis: dispatch_status resolves the stale correlation; read the session dir — run files carry the new mode/timestamps while session-metadata.json still holds the old mode/profile/plan. Verified repair: prove the defect deterministic with the permitted mechanical retry, back up session-metadata.json (e.g. session-metadata.json.bak-<old-mode>), patch mode, change_profile, the plan entries (include the agents that actually ran, with their genuine planner-issued models/tiers/reasons), and coverage to the exact values passed to the session's own dispatch_review_runs call, then retry the identical consolidate — the finalizer computes the verdict from the real run files on disk; nothing is hand-computed. Two bound retries suffice for the identical-call limit.
