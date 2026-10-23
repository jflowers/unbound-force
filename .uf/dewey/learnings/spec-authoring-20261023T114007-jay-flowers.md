---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-23T11:40:07Z
identity: spec-authoring-20261023T114007-jay-flowers
tier: draft
---

OpenSpec MODIFIED-delta stacking is one-level absorption and archive-order-fragile. Verified in unbound-force/unbound-force (PR #793 review): the `unleash` capability's `Command delegation tool` requirement carries three active deltas — unleash-deterministic-tools ADDED the base contract; unleash-pipeline-hardening MODIFIED it to model-resolution text only (dropping the base contract); delegation-skill-enforcement MODIFIED it again, absorbing hardening's text verbatim but not dt's. Because MODIFIED application replaces requirements by name and `openspec validate` passes regardless of ordering, (a) archiving hardening after DSE silently drops the classification contract from the spec of record, and (b) no archive order produces the full union — the base contract survives only in the ADDED delta that any later archive overwrites. Guidance for future stacked changes: absorb the FULL chain's text (not just the immediately-prior delta), or record the archive-order/reconciliation constraint in the change's design.md Risks; prefer all-ADDED deltas (append semantics, order-tolerant) like DSE's determinism-policy delta when the requirement is new rather than shared. Also: the grep tool fails silently on absolute paths containing `@` (e.g. unbound-force@chai) — use repo-relative paths for in-repo searches.
