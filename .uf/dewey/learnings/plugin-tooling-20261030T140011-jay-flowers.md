---
tag: plugin-tooling
author: jay-flowers
category: pattern
created_at: 2026-10-30T14:00:11Z
identity: plugin-tooling-20261030T140011-jay-flowers
tier: draft
---

In a repo whose plugin source carries a byte-identical scaffold mirror, every duplication is doubled: a 3-copy prologue in .opencode/plugins/review-dispatch/index.ts is 6 copies once the internal/scaffold/assets mirror is counted, so DRY thresholds are effectively crossed earlier than they appear. When a change both extracts shared helpers (citing the DRY convention pack) and simultaneously adds new verbatim copies elsewhere in the same file, audit the change's TOTAL new-duplication footprint — planned consolidations and unplanned copies routinely co-occur. Review signal: "Mirrors X" comments in newly added code mark duplication debt, not exemption from it; count call sites of any copied block over ~10 lines, including mirror copies, before approving.
