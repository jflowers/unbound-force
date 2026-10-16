---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-15T13:59:15Z
identity: documentation-gate-20261015T135915-jay-flowers
tier: draft
---

Spec docs-issue plans that name multiple filing targets must attach duplicate-avoidance (search existing open issues, then reference or consolidate) to every target, not only the cross-repo one. Verified in unleash-deterministic-tools spec review iteration 3 (2026-10-15): the website target referenced five existing open issues including Increment 1's website issue #307, while the repo-local target referenced none — despite Increment 1's repo docs issue #728 and adjacent open docs issues #710 (uf-workflow plugin tools) and #706 (checkpoint tools) existing. Recurring pattern: authors duplicate-check the unfamiliar target (another repository) and skip the familiar one (their own repo), where the predecessor issue is most likely to exist.
