---
tag: openspec
author: jay-flowers
category: reference
created_at: 2026-10-16T22:21:31Z
identity: openspec-20261016T222131-jay-flowers
tier: draft
---

A compatibility alias (same registered tool name, preserved factory signature, delegating to a merged implementation) preserves the registration surface a superseded spec change required — but NOT its input contract. In PR #745 (unleash-deterministic-tools), createPersistUnleashSummaryTool delegates to write_unleash_summary, keeping persist-unleash-summary's FR-005 (registration) satisfied while the contract grew from 3 validated parameters to 8 zod-required parameters — so the sibling change's FR-004 ('All three tool parameters MUST be non-empty') and FR-006 (command prose calling persist_unleash_summary with three section bodies) survive as main-spec contradictions that no validation catches, because the two changes modify different capabilities and OpenSpec conflict detection is per-capability. When deduplicating a sibling change's tool via alias: (1) carry a MODIFIED/REMOVED delta in the superseding change against the sibling capability, anchored to the sibling's unarchived requirement text; (2) name every superseded unarchived sibling in the proposal's Sequencing bullet with the pinned archive order; (3) add a deferred-validation task (the task 9.2 pattern) to re-verify anchors after each sibling archives; (4) where scope permits, annotate the superseded change's own delta spec with superseded-by references at the stale requirement lines — the only order-independent enforcement point.
