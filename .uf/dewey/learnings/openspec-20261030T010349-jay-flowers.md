---
tag: openspec
author: jay-flowers
category: pattern
created_at: 2026-10-30T01:03:49Z
identity: openspec-20261030T010349-jay-flowers
tier: draft
---

When a late-verified edge case forces a parsing-rule carve-out in code, back-port the carve-out into the spec requirement text and the design's parsing-rule paragraph — not just code, tests, command prose, and CHANGELOG. The requirement record is what future re-implementations and contract tests are authored from; an uncarved requirement re-introduces the regression the change exists to prevent. In extend-fetch-pr-review-context, the zero-checks carve-out (empty stdout + "no checks reported" stderr marker at exit 1 → passing) reached code, tests, command prose, tool description, and CHANGELOG but not FR-013 or design D4, leaving the spec mandating failure for a shape the implementation deliberately passes.
