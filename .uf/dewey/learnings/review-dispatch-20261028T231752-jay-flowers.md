---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-28T23:17:52Z
identity: review-dispatch-20261028T231752-jay-flowers
tier: draft
---

When adding a field to review-dispatch run files (PersistedRunData), the strict zod DispatchRunSchema used by consolidation does not parse the raw run file — consolidate_dispatch maps fields explicitly into the schema shape (index.ts ~line 3901, runs.map(...)). Run-file-only audit fields (prompt, post_submission_abort, discarded_submissions, and now timeout provenance) are therefore safe to add to PersistedRunData WITHOUT touching DispatchRunSchema: the field persists in run-*.json (JSON.stringify drops the key when undefined, keeping older writers byte-compatible), readers like dispatch_status read it leniently off PersistedRunData, and the strict finalization payload never sees it. The reverse is the trap: adding the field to the raw run file AND expecting DispatchRunSchema to accept it would break consolidation, because the schema is .strict() and rejects unknown keys. Pattern observed in derive-per-run-timeout (RD-FR-030): field added to PersistedRunData, deliberately not mapped in the consolidate runs.map, with a comment at the mapping site stating the omission is intentional.
