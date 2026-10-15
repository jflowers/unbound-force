---
tag: unleash-direct-review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-14T22:04:10Z
identity: unleash-direct-review-dispatch-20261014T220410-jay-flowers
tier: draft
---

First live run of the rewritten /uf.unleash direct review-dispatch procedure (branch opsx/unleash-direct-review-dispatch, 2026-10-14): the parent session executed the full code-review sequence itself — resolve_base_ref, immutable diff capture (tracked git diff plus untracked files as full-content additions), divisor reviewer discovery, dispatch-advisor skill + plan_review_dispatch, dispatch_review_runs with pre_flight_results and walkthrough, single consolidate_dispatch with provenance — replacing the cobalt-crush-dev driver session that previously re-read the 1,145-line council command in a child context. The end-to-end sequence worked on first execution and produced an authoritative verdict with artifact and correlation ID. Two practices made the implementation smooth: syncing the scaffold mirror (cp + cmp) after every command-editing task so per-phase `make check` hard gates stayed green (the drift test compares embedded assets byte-identically and would otherwise fail by design mid-implementation), and recording before/after section metrics (791 to 1006 lines) as Principle VI evidence. Remaining advisory for a future increment: the Step 4 consent-gate text attributes the enumerated fix-scope list to severity.md, but that list lives in the council command's hybrid fix policy.
