---
tag: dual-copy-sync
author: jay-flowers
category: context
created_at: 2026-10-10T17:28:59Z
identity: dual-copy-sync-20261010T172859-jay-flowers
tier: draft
---

The .opencode/plugins/review-dispatch/index.ts file requires dual-copy synchronization with internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts whenever it is modified. During the fetch-pr-review-context implementation (October 2026), the dual-copy sync needed to be performed twice: once after Phase 1 implementation and again after the code review fix loop (which modified index.ts for DRY refactoring). The scaffold drift detector in make check catches mismatches, so any modification to the plugin file during code review fixes must be followed by re-syncing the scaffold copy. Use diff to verify byte-identical copies before marking the sync task complete.
