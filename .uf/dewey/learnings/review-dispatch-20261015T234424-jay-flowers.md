---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-15T23:44:24Z
identity: review-dispatch-20261015T234424-jay-flowers
tier: draft
---

The review-dispatch plugin (uf.unleash code review, branch opsx/persist-unleash-summary, 2026-10-15) persists session metadata only on the FIRST dispatch_review_runs call per opencode session (sessionCorrelationMap is keyed by context.sessionID, one correlation per session; line 2722 `if (isFirstCall && input.session_metadata !== undefined)`). When a single session runs two dispatches (e.g., /uf.unleash spec review then code review), the second dispatch's session_metadata is silently ignored, and consolidate_dispatch fails with "artifact commit must equal the immutable reviewed head SHA" because the on-disk session-metadata.json still carries the first dispatch's head SHA. Repair: overwrite session-metadata.json in the dispatch session dir (/tmp/.../dispatch-<correlation-id>/) with the current dispatch's session_metadata, then re-run consolidate_dispatch with the same provenance — finalization succeeds on the retry. Longer-term fix candidates: key metadata per (sessionID, correlation) or update metadata on every dispatch call.
