---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-19T16:42:09Z
identity: review-dispatch-20261019T164209-jay-flowers
tier: draft
---

Reclassifying a failed run as successful must satisfy every field of the existing success-run contract, not just the field that motivated the change. In review-dispatch, RD-FR-008 defines success as "null error AND a non-null native verdict"; the #751 recovery change verified only the error field while its design explicitly left workflow_verdict null (child agents emit their verdict at the END of the final response, so aborted runs carry null verdicts). The finalizer rejection the change existed to fix would be reintroduced through a different field. Rule: when changing a status classification, enumerate every field of the target contract and add verification tasks for each.
