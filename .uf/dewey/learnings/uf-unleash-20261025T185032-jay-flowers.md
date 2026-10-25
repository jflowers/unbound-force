---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-25T18:50:32Z
identity: uf-unleash-20261025T185032-jay-flowers
tier: draft
---

In /uf.unleash review-council fix loops, Dewey learnings stored during feedback iterations (after the last fix commit) remain untracked in .uf/dewey/learnings/ and are excluded from the council's diff capture because they sit outside the feature dir — the review context can report a clean tree while workflow learnings sit uncommitted. Before PR creation, run git status on .uf/dewey/learnings/ and stage this change's loop learnings explicitly; uf_finale_stage's stage-all sweeps them as a backstop, but the commit-scope rule calls for explicit staging at each fix commit.
