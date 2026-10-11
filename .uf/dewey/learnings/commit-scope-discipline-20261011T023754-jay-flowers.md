---
tag: commit-scope-discipline
author: jay-flowers
category: pattern
created_at: 2026-10-11T02:37:54Z
identity: commit-scope-discipline-20261011T023754-jay-flowers
tier: draft
---

When a large removal/cleanup change is in progress and an unrelated bug fix is discovered (e.g., the /tmp path validation fix in review-dispatch), the fix should be committed on a separate branch (e.g., chore/review-dispatch-tmp-path) rather than bundled into the feature branch. This prevents scope creep findings during review council and keeps the feature branch's diff traceable to a single spec. The AGENTS.md commit scope rule explicitly requires this separation for 'unrelated scaffold refreshes.'
