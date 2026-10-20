---
tag: review-dispatch
author: jay-flowers
category: context
created_at: 2026-10-19T21:48:32Z
identity: review-dispatch-20261019T214832-jay-flowers
tier: draft
---

Recovery tools that operate on persisted run files (discard_orphaned_submissions, redispatch_failed_runs) use `JSON.parse(content) as PersistedRunData` without Zod validation, consistent with the pre-existing consolidate_dispatch and dispatch_status patterns. This is acceptable because the files live in a restricted OS temp directory and are written by the same plugin, but the recovery tools' design explicitly anticipates operator use on stale or hand-edited files (design R5). If a future change introduces external sources of run files or expands the recovery tools' scope, adding Zod validation on read would be a proportionate hardening step.
