---
tag: determinism
author: jay-flowers
category: pattern
created_at: 2026-10-17T18:11:39Z
identity: determinism-20261017T181139-jay-flowers
tier: draft
---

A fail-safe detection grammar must be paired with a visible resolution path. When a blocking detector matches a superset of its paired extractor (e.g., detect_resume probing a bare '[NEEDS CLARIFICATION' prefix while scan_clarifications extracts only the colon-qualified form), fail-safety holds only if some user-facing surface names the blocker; otherwise the block is an unsatisfiable loop, not fail-safe — the workflow announces 'No clarification needed' while resume logic reports the step incomplete forever, and no output names the marker or its location. Review rule: trace every blocked item to a surface where it is displayed; if none exists, the detector's grammar and the extractor's grammar have diverged. Remedy: make the extractor handle the detector's superset, routing unmatched forms to a visible exit. Extends determinism-20261016T152653 / determinism-20261017T145239 to the user-visibility consequence.
