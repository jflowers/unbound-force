---
tag: spec-review
author: jay-flowers
category: reference
created_at: 2026-10-20T12:48:00Z
identity: spec-review-20261020T124800-jay-flowers
tier: draft
---

When remediating a spec-review finding that requires negative-input scenarios, mirror the scenario across every tool whose input contract changed in the delta — including parameters added to pre-existing tools, not only newly introduced tools. In fix-review-dispatch-recovery (PR #776), the new recovery tools (discard_orphaned_submissions, redispatch_failed_runs) each gained a 'rejects invalid input' scenario naming malformed correlation ids, but RD-FR-027 — which added an explicit correlation_id parameter to the pre-existing dispatch_status and consolidate_dispatch tools — shipped without the mirrored rejection scenario, even though the implementation added Zod UUID validation and a test for it. Extending a tool's args is an input-contract change exactly like adding a new tool; scenario coverage must follow the contract, not the novelty of the tool. Refines spec-review-20261019T223124 (deltas must carry input contracts and negative scenarios) with a coverage rule for the extension case.
