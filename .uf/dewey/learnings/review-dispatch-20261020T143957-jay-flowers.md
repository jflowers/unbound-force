---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-20T14:39:57Z
identity: review-dispatch-20261020T143957-jay-flowers
tier: draft
---

When maintainer review feedback prescribes an internal refactor of a live OpenCode plugin file (e.g., .opencode/plugins/review-dispatch/index.ts), the acceptance plan must extend the reviewer's suggested approach with the repo obligations the feedback does not name: (1) byte-identical sync of the embedded scaffold twin under internal/scaffold/assets/ — CI drift tests enforce parity and scaffolded sibling repos inherit the code only through the twin; (2) verbatim preservation of the test-pinned observable output shape, since the spec-delta scenarios in .opencode/test/ are the behavior contract; and (3) sequencing with sibling feedback items that touch the same construction sites to avoid double rework. Deferring an internal refactor to a follow-up change costs more than accepting it in-cycle, because spec-first rules require a separate change and branch for non-trivial refactors. Observed on PR 776 item 3 (fix-review-dispatch-recovery): decomposition feedback on createRedispatchFailedRunsTool/createDiscardOrphanedSubmissionsTool named only the live plugin path, omitting the twin-sync and sequencing obligations.
