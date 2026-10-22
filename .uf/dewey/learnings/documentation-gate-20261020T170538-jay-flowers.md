---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-20T17:05:38Z
identity: documentation-gate-20261020T170538-jay-flowers
tier: draft
---

Changelog entries drafted mid-iteration go stale when review feedback changes the implementation. Re-fact-check every changelog claim (field presence, counts, absolute words like "always"/"never") against the final code before PR submission. Example: PR #776 (fix-review-dispatch-recovery) iteration 1 shipped always-present warnings/proposals fields on the consolidate_dispatch no-provenance path; the review-feedback fix changed them to omitted-when-empty, but the CHANGELOG retained "now always carry" (CHANGELOG.md:329).
