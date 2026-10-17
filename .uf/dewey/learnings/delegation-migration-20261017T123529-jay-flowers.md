---
tag: delegation-migration
author: jay-flowers
category: reference
created_at: 2026-10-17T12:35:29Z
identity: delegation-migration-20261017T123529-jay-flowers
tier: draft
---

When a spec delta mandates migrating N call sites to a new tool, enumerate every call site in the task breakdown and verify completion with a negative grep for the legacy mechanism in the command file (e.g., "via the Task tool") before marking migration tasks complete. In the unleash-deterministic-tools change (PR #745), the spec required Steps 2/3/5 AND Step 6 code-fix delegation through uf_delegate_command; task 2.2 added tool-side prompt-only support for code-fix calls, tasks 2.3/5.2 migrated the Steps 2/3/5 call sites, but the Step 8 fix-loop call site still used the Task tool — missed across three review rounds because the task 7.4 after-deltas note framed Step 6 changes as exit-template composition only. The negative grep is the cheap completion check that catches an orphaned legacy call site.
