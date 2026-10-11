---
tag: hero-removal-review
author: jay-flowers
category: pattern
created_at: 2026-10-11T02:20:08Z
identity: hero-removal-review-20261011T022008-jay-flowers
tier: draft
---

When removing a hero or major subsystem from the Unbound Force codebase, the Guard persona should check ALL constitution sections (not just the one named in the task description) for stale hero references. The Composability First example at line 93 was missed because the task only mentioned 'Observable Quality rationale'. A systematic grep of the constitution for all removed hero names would catch these.
