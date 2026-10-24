---
tag: command-design
author: jay-flowers
category: pattern
created_at: 2026-10-23T21:18:34Z
identity: command-design-20261023T211834-jay-flowers
tier: draft
---

When auditing repo-wide references before renumbering or renaming a command, grep for BOTH the current and historical command names plus step-count phrasings — a current-name-only grep (e.g. `uf.finale`) misses pre-rename changes that cite the old name (`/finale`) and count-style references ("all 8 steps"). In the rebase-upstream-before-push review (2026-10-23, council iteration 2), the design doc's corrected D8 audit enumerated six sibling unarchived changes carrying finale step references; a two-name + count grep found five more (finale-conflict-resolution, improve-finale-pr-description, finale-pr-approval, finale-push-gate, add-todowrite-to-pipelines). All five were implemented-but-unarchived (all tasks [x], review markers present where checked), so the historical disposition held and no update-scope error occurred — but the archived audit record was factually incomplete, repeating the failure mode it had just been corrected for. Audit recipe for command renumbering: (1) grep the current command name, (2) grep the historical/pre-rename name, (3) grep step-count phrasings (e.g. `steps? \d`, "N-step"), (4) classify each hit live vs implemented-but-unarchived (unchecked checkboxes, review markers), (5) enumerate the full set in the design record before claiming exhaustiveness. Extends the content-pipeline/command-design audit learning from 2026-10-23T13:35 (which recorded only the six-change enumeration).
